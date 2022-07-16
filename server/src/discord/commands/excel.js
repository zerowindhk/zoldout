const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('excel')
    .setDescription('提供資料來源的 Google Sheet'),
  async execute(interaction) {
    const embed = new MessageEmbed({
      title: 'Zold:Out 查詢區',
      url: 'https://docs.google.com/spreadsheets/d/1CeTO-Bae2xNGrAtTo1zAb81joirxu4CGnrdVieXQbfU/view#gid=0',
    });
    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
