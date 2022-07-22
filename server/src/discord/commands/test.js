const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('提供資料來源的 Google Sheet'),
  async execute(interaction) {
    console.log(interaction);
    await interaction.reply('Pong!');
    console.log('fetchReply', interaction);
    const message = await interaction.fetchReply();
    console.log(message);
    await interaction.followUp('Pong again!');
  },
};
