const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { findLikeResource, findResource } = require('../../googleSheet');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('material')
    .setDescription(
      '查找素材最高掉落的關卡/Find the stage with highest material drop/材料ドロップが最も多いレベルを見つける'
    )
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('素材名稱/Material Name/素材名')
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
        .setName('private')
        .setDescription('私密查詢/Private Search/非公開クエリ')
        .setRequired(false)
    ),
  async execute(interaction) {
    const { options } = interaction;
    await interaction.deferReply({
      ephemeral: options.getBoolean('private') || false,
    });
    const lang = options.getString('language');
    const likeResourceName = options.getString('name');
    const resourceNameList = await findLikeResource(likeResourceName, lang);
    const resourceCount = resourceNameList.length;
    if (resourceCount) {
      const rows = [];
      for (let i = 0; i <= resourceCount / 5 + 1 && i <= 5; i++) {
        const start = i * 5;
        const sliceResourceNameList = resourceNameList.slice(start, start + 5);
        if (sliceResourceNameList.length) {
          const row = new MessageActionRow({
            components: sliceResourceNameList.map(
              (item) =>
                new MessageButton({
                  custom_id: `${item}`,
                  label: `${item}`,
                  style: 'PRIMARY',
                })
            ),
          });
          rows.push(row);
        }
      }
      const embed = new MessageEmbed({
        title: likeResourceName,
        color: '#33FF99',
        description:
          lang == 'en'
            ? `${resourceCount} Found.`
            : lang == 'jp'
            ? `${resourceCount}件見つかりました`
            : `已查找${resourceCount}項。`,
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
        const { customId: resourceName } = i;
        console.log('choice', resourceName);
        const resourceResult = await findResource(resourceName, lang);
        const embed = new MessageEmbed({
          title: resourceName,
          color: '#5544ff',
          description: `${resourceResult.amount} @ ${resourceResult.stage}`,
        });
        await i.update({
          embeds: [embed],
          components: [],
        });
      });
      collector.on('end', (collected) => {});
    } else {
      const embed = new MessageEmbed({
        title: likeResourceName,
        color: '#ff0000',
        description:
          lang == 'en'
            ? 'No Such Material'
            : lang == 'jp'
            ? '材料なし'
            : '沒有此素材',
      });
      await interaction.editReply({
        embeds: [embed],
      });
    }
  },
};
