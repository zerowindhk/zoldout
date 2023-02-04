const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('excel')
    .setDescription('資料來源/DataSource/出典'),
  async execute(interaction) {
    const embed = new MessageEmbed({
      title: 'Zold:Out 查詢區/Information Centre',
      url: 'https://docs.google.com/spreadsheets/d/1CeTO-Bae2xNGrAtTo1zAb81joirxu4CGnrdVieXQbfU/view#gid=0',
    });
    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
