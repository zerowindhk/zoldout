const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
} = require('discord.js');
const {
  findLikeWeapon,
  findWeaponResource,
  getAllInformationList,
  getInformation,
} = require('../../googleSheet');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('library')
    .setDescription(
      '尋找資料庫收集物/Find Library Collections/データベース コレクションの検索'
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
      ephemeral: options.getBoolean('private') ?? true,
    });
    const lang = options.getString('language');
    const list = await getAllInformationList(lang);
    // console.log('getAllInformationList', list);
    const count = list.length;
    if (count) {
      const rows = [];
      for (let i = 0; i <= list.length / 5 + 1 && i <= 5; i++) {
        const start = i * 5;
        const sliceList = list.slice(start, start + 5);
        if (sliceList.length) {
          const row = new ActionRowBuilder({
            components: sliceList.map(
              (item) =>
                new ButtonBuilder({
                  custom_id: `${item}`,
                  label: `${item}`,
                  style: ButtonStyle.Primary,
                })
            ),
          });
          // console.log(row);
          rows.push(row);
        }
      }
      const embed = new EmbedBuilder({
        title: '資料庫',
        color: 0x4422ff,
        description:
          lang == 'en'
            ? 'Please select what you want to find'
            : lang == 'jp'
            ? 'ご覧になりたい情報を選択してください'
            : '請選擇想要查找資料',
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
        const result = await getInformation(name, lang);
        const stages = result.stages.map((stage, index) => ({
          name: `${index + 1}/${result.stages.length}`,
          value: stage,
          inline: true,
        }));
        const embed = new EmbedBuilder({
          title: name,
          color: 0x0099ff,
          description:
            lang == 'en'
              ? `Reward: ${result.reward}\nCollection Stages below：`
              : lang == 'jp'
              ? `アワード: ${result.reward}\n収集レベルは次のとおりです：`
              : `獎勵: ${result.reward}\n收集關卡如下：`,
          fields: stages,
        });
        await i.update({
          embeds: [embed],
          components: [],
        });
      });
      collector.on('end', (collected) => {});
    } else {
      const embed = new EmbedBuilder({
        title: 'Bugs',
        color: 0xff0000,
        description:
          lang == 'en' ? 'Not Found' : lang == 'jp' ? '情報なし' : '沒有此資訊',
      });
      await interaction.editReply({
        embeds: [embed],
      });
    }
  },
};
