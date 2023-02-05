const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { findLikeWeapon, findWeaponResource } = require('../../googleSheet');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weapon')
    .setDescription(
      "查找武器素材掉落的關卡/Find the level where the weapon's material drops/武器の素材がドロップするレベルを探す"
    )
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('武器名稱/Weapon Name/兵器の名前')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('language')
        .setDescription('語言/Language/言語')
        .setRequired(true)
        .setChoices(
          {
            name: '中文',
            value: 'zh',
          },
          {
            name: 'English',
            value: 'en',
          },
          {
            name: '日本語',
            value: 'jp',
          }
        )
    )
    .addBooleanOption((option) =>
      option
        .setName('weapon_first')
        .setDescription(
          '選擇優先是擁有武器素材關卡/The priority of selection is to have the weapon material level/選択の優先順位は、武器の材料レベルを持つことです'
        )
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName('private')
        .setDescription('私密查詢/Private Search/非公開クエリ')
        .setRequired(false)
    ),
  async execute(interaction) {
    const { options } = interaction;
    await interaction.deferReply({
      ephemeral: options.getBoolean('private') ?? false,
    });
    const lang = options.getString('language');
    const likeWeaponName = options.getString('name');
    const weaponFirst = options.getBoolean('weapon_first') ?? false;
    const weaponNameList = await findLikeWeapon(likeWeaponName, lang);
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
        description:
          lang == 'en'
            ? `${weaponCount} Found.`
            : lang == 'jp'
            ? `${weaponCount}件見つかりました`
            : `已查找${weaponCount}項。`,
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
        const weaponResult = await findWeaponResource(
          weaponName,
          lang,
          weaponFirst
        );
        const stagesToString = weaponResult.stages.join(' / ');

        const resourcesToField = weaponResult.resources.map(
          (resourceResult) => {
            const dropWeaponMsg =
              lang == 'en'
                ? `Weapon Fragment Drop: ${
                    resourceResult.findWithWeapon ? 'Yes' : 'No'
                  }`
                : lang == 'jp'
                ? `武器の欠片を落とす：${
                    resourceResult.findWithWeapon ? 'はい' : 'いいえ'
                  }`
                : `掉落武器碎片：${
                    resourceResult.findWithWeapon ? '是' : '否'
                  }`;
            return {
              name: resourceResult.resourceName,
              value: `${resourceResult.amount} @ ${resourceResult.stage}\n${dropWeaponMsg}`,
              inline: true,
            };
          }
        );
        const embed = new MessageEmbed({
          title: weaponName,
          color: '#0099ff',
          description:
            lang == 'en'
              ? `Drop Stage: ${stagesToString}`
              : lang == 'jp'
              ? `ドロップレベル ${stagesToString}`
              : `掉落關卡: ${stagesToString}`,
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
        description:
          lang == 'en'
            ? 'No Such Weapon'
            : lang == 'jp'
            ? 'そんな武器ない'
            : '沒有此武器',
      });
      await interaction.editReply({
        embeds: [embed],
      });
    }
  },
};
