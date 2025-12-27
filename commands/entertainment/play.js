
require('dotenv').config();
const { SlashCommandBuilder } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  StreamType,
  VoiceConnectionStatus,
  entersState,
} = require('@discordjs/voice');
const { spawn } = require('child_process');

const { nowPlayingEmbed } = require('../../utils/embeds');
const { getYouTubeVideoDetails } = require('../../utils/YoutubeDetails');

// Queue map "global" within this file
const queueMap = new Map();

/* ================================
   AUDIO PIPELINE (yt-dlp + ffmpeg)
================================ */
function createYTDLPStream(url) {
  const ytdlp = spawn('yt-dlp', ['-f', 'bestaudio', '-o', '-', url]);
  const ffmpeg = spawn('ffmpeg', [
    '-loglevel', 'error',
    '-i', 'pipe:0',
    '-map', '0:a',
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-f', 'ogg',
    'pipe:1',
  ]);

  ytdlp.stdout.pipe(ffmpeg.stdin);
  return ffmpeg.stdout;
}

/* ================================
   PLAYBACK CONTROLLER
================================ */
async function playNext(guildId, interaction) {
  const queue = queueMap.get(guildId);
  if (!queue || queue.songs.length === 0) return;

  const song = queue.songs[0];

  try {
    const stream = createYTDLPStream(song.url);
    const resource = createAudioResource(stream, { inputType: StreamType.OggOpus });

    queue.player.play(resource);

    const { title, author, duration, thumbnail } = await getYouTubeVideoDetails(song.url);

    // Now Playing embed
    await interaction.channel.send({
      embeds: [
        nowPlayingEmbed(
          interaction.guild.name,
          interaction.guild.iconURL(),
          title,
          author,
          duration,
          queue.songs.length - 1,
          '100',
          song.requester,
          thumbnail || undefined,
          true // isActive = Now Playing
        ),
      ],
    });
  } catch (err) {
    console.error('Playback error:', err);
    queue.songs.shift();
    playNext(guildId, interaction);
  }
}

/* ================================
   COMMAND DEFINITION
================================ */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube')
    .addStringOption(opt =>
      opt.setName('query').setDescription('Song name or YouTube URL').setRequired(true).setAutocomplete(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const query = interaction.options.getString('query');
    if (!query) return interaction.editReply('❌ No query provided.');

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) return interaction.editReply('❌ Join a voice channel first.');

    const guildId = interaction.guildId;
    let queue = queueMap.get(guildId);

    // Reset stale queue if connection destroyed or idle
    if (
      queue &&
      (!queue.connection || queue.connection.state.status === 'destroyed' || queue.player.state.status === 'idle')
    ) {
      queueMap.delete(guildId);
      queue = null;
    }

    // Create new queue if none exists
    if (!queue) {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();

      player.on(AudioPlayerStatus.Idle, () => {
        queue.songs.shift();
        playNext(guildId, interaction);
      });

      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch {
          if (queue?.player) queue.player.stop();
          connection.destroy();
          queueMap.delete(guildId);
        }
      });

      connection.subscribe(player);

      queue = { connection, player, songs: [] };
      queueMap.set(guildId, queue);
    }

    // Determine video URL
    let videoUrl = query;
    if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
      const search = spawn('yt-dlp', [`ytsearch1:${query}`, '--print', 'webpage_url']);
      videoUrl = await new Promise((resolve, reject) => {
        let data = '';
        search.stdout.on('data', c => (data += c));
        search.on('close', () => resolve(data.trim()));
        search.on('error', reject);
      });
      if (!videoUrl) return interaction.editReply('❌ No results found.');
    }

    queue.songs.push({ url: videoUrl, requester: interaction.user.id });

    // Start playback if first song
    if (queue.songs.length === 1) {
      playNext(guildId, interaction);
    } else {
      // Send Next Up embed for queued songs
      const nextSong = queue.songs[queue.songs.length - 1];
      const { title, author, duration, thumbnail } = await getYouTubeVideoDetails(nextSong.url);

      await interaction.channel.send({
        embeds: [
          nowPlayingEmbed(
            interaction.guild.name,
            interaction.guild.iconURL(),
            title,
            author,
            duration,
            queue.songs.length - 1,
            '100',
            nextSong.requester,
            thumbnail || undefined,
            false // isActive = Next Up
          ),
        ],
      });
    }
  },
};
