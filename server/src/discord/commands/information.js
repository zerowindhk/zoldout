const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const {
  findLikeWeapon,
  findWeaponResource,
  getAllInformationList,
  getInformation,
} = require('../../googleSheet');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('information')
    .setDescription('尋找資料庫收集物')
    .addBooleanOption((option) =>
      option
        .setName('private')
        .setDescription('如不想讓人知道自己在查甚麼就Yes')
        .setRequired(false)
    ),
  async execute(interaction) {
    const { options } = interaction;
    await interaction.deferReply({
      ephemeral: options.getBoolean('private') ?? true,
    });
    const list = await getAllInformationList();
    console.log('getAllInformationList', list);
    const count = list.length;
    if (count) {
      const rows = [];
      for (let i = 0; i <= list.length / 5 + 1 && i <= 5; i++) {
        const start = i * 5;
        const sliceList = list.slice(start, start + 5);
        if (sliceList.length) {
          const row = new MessageActionRow({
            components: sliceList.map(
              (item) =>
                new MessageButton({
                  custom_id: `${item}`,
                  label: `${item}`,
                  style: 'PRIMARY',
                })
            ),
          });
          // console.log(row);
          rows.push(row);
        }
      }
      const embed = new MessageEmbed({
        title: '資料庫',
        color: '#4422FF',
        description: '請選擇想要查找資料',
      });
      await interaction.editReply({
        components: rows,
        embeds: [embed],
      });
      const filter = (i) => i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 15000,
      });
      collector.on('collect', async (i) => {
        const { customId: name } = i;
        console.log('choice', name);
        const result = await getInformation(name);
        const stages = result.stages.map((stage, index) => ({
          name: `${index + 1}/${result.stages.length}`,
          value: stage,
          inline: true,
        }));
        const embed = new MessageEmbed({
          title: name,
          color: '#0099ff',
          description: `獎勵: ${result.reward}\n收集關卡如下：`,
          fields: stages,
        });
        await i.update({
          embeds: [embed],
          components: [],
        });
      });
      collector.on('end', (collected) => {});
    } else {
      const embed = new MessageEmbed({
        title: 'Bugs',
        color: '#ff0000',
        description: '沒有此資訊',
      });
      await interaction.editReply({
        embeds: [embed],
      });
    }
  },
};
