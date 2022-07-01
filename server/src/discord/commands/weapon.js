const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { findLikeWeapon, findWeaponResource } = require('../../googleSheet');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weapon')
    .setDescription('查找包含名字的武器及其素材最高掉落的關卡')
    .addStringOption((option) =>
      option.setName('name').setDescription('武器名稱').setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName('private')
        .setDescription('如不想讓人知道自己在查甚麼就Yes')
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply({
      ephemeral: options.getBoolean('private') || false,
    });
    const likeWeaponName = options.getString('name');
    const weaponNameList = await findLikeWeapon(likeWeaponName);
    const weaponCount = weaponNameList.length;
    if (weaponCount) {
      const rows = [];
      for (let i = 0; i <= weaponNameList.length / 5 + 1 && i <= 5; i++) {
        const start = i * 5;
        const sliceWeaponNameList = weaponNameList.slice(start, start + 5);
        if (sliceWeaponNameList.length) {
          const row = new MessageActionRow({
            components: sliceWeaponNameList.map(
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
        title: likeWeaponName,
        color: '#33FF99',
        description: `已查找${weaponCount}項。`,
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
        const { customId: weaponName } = i;
        console.log('choice', weaponName);
        const weaponResult = await findWeaponResource(weaponName);
        const stagesToString = weaponResult.stages.join(' / ');
        const resourcesToField = weaponResult.resources.map(
          (resourceResult) => ({
            name: resourceResult.resourceName,
            value: `${resourceResult.amount} @ ${
              resourceResult.stage
            }\n掉落武器碎片：${resourceResult.findWithWeapon ? '是' : '否'}`,
            inline: true,
          })
        );
        const embed = new MessageEmbed({
          title: weaponName,
          color: '#0099ff',
          description: `掉落關卡: ${stagesToString}`,
          fields: resourcesToField,
        });
        await i.update({
          embeds: [embed],
          components: [],
        });
      });
      collector.on('end', (collected) => {});
    } else {
      const embed = new MessageEmbed({
        title: likeWeaponName,
        color: '#ff0000',
        description: '沒有此武器',
      });
      await interaction.editReply({
        embeds: [embed],
      });
    }
  },
};
