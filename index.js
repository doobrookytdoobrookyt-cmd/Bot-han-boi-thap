require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

const players = {};

function getPlayerData(userId) {
  if (!players[userId]) {
    players[userId] = {
      gold: 100000,
      inventory: [],
      buffSkill: null,
      lastSkillTime: 0,
      skillsOwned: [1, 2],
    };
  }
  return players[userId];
}

const SKILL_DATABASE = [
  { id: 1, ten: '🎋 Tuyệt Kỹ: Khai Môn Khí', desc: 'Khai mở khí môn, tăng 15% tỉ lệ cá Thường', gia: 0 },
  { id: 2, ten: '⚔️ Tuyệt Kỹ: Đoạn Thủy Trảm', desc: 'Đoạn tuyệt thủy lưu, tăng 20% lực giật cần', gia: 0 },
  { id: 3, ten: '🔪 Tuyệt Kỹ: Vạn Cần Đao', desc: 'Vung cần như đao xé sóng, giảm 5s hồi chiêu', gia: 50000 },
  { id: 4, ten: '💥 Tuyệt Kỹ: Trảm Mông Ngư', desc: 'Trảm mông cự ngư, x2 Vàng cá dưới 1000 Cân', gia: 100000 },
  { id: 5, ten: '🌀 Tuyệt Kỹ: Phá Sóng Thần', desc: 'Phá vỡ mặt nước, x1.5 cân nặng lượt sau', gia: 200000 },
];

const DANH_SACH_CA = [
  { ten: '👞 Giày Cao Cổ Đáy Hồ (Hàng Tế)', minKg: 1, maxKg: 5, tyLe: 50, giaVangPerKg: 1, loai: 'rac' },
  { ten: '🐟 Cá Rô Cụ "Vững Như Chó Già"', minKg: 10, maxKg: 50, tyLe: 35, giaVangPerKg: 2, loai: 'thuong' },
  { ten: '🐠 Cá Diếc Đã Tốt Nghiệp Đại Học', minKg: 50, maxKg: 200, tyLe: 10, giaVangPerKg: 5, loai: 'thuong' },
  { ten: '🦈 Cá Mập Lưỡi Dao Hào Đế', minKg: 1000, maxKg: 5000, tyLe: 4, giaVangPerKg: 10, loai: 'hiem' },
  { ten: '👑 TỐ TỐ THẦN THOẠI - VẠN CÂN CHI VƯƠNG', minKg: 100000000, maxKg: 500000000, tyLe: 1, giaVangPerKg: 500, loai: 'than_thoai' },
];

// 1. KHAI BÁO DANH SÁCH SLASH COMMANDS (DANH SÁCH LỆNH /)
const commands = [
  new SlashCommandBuilder().setName('f').setDescription('Quăng cần câu cá Vạn Cân'),
  new SlashCommandBuilder().setName('skill').setDescription('Thi triển tuyệt kỹ hỗ trợ câu cá'),
  new SlashCommandBuilder().setName('gio').setDescription('Xem giỏ cá hiện tại của bạn'),
  new SlashCommandBuilder().setName('banca').setDescription('Bán toàn bộ cá trong giỏ lấy Vàng'),
  new SlashCommandBuilder()
    .setName('skillshop')
    .setDescription('Xem cửa hàng Tuyệt Kỹ')
    .addIntegerOption(option => option.setName('trang').setDescription('Trang cần xem').setRequired(false)),
  new SlashCommandBuilder()
    .setName('muaskill')
    .setDescription('Mua tuyệt kỹ từ cửa hàng')
    .addIntegerOption(option => option.setName('id').setDescription('ID Tuyệt Kỹ cần mua').setRequired(true)),
];

// 2. ĐĂNG KÝ LỆNH SLASH VỚI DISCORD KHI BOT ON
client.once('ready', async () => {
  console.log(`Bot ${client.user.tag} đã online! Đang đăng ký Slash Commands...`);
  
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands.map(cmd => cmd.toJSON()) }
    );
    console.log('✅ Đã đăng ký thành công tất cả các lệnh Slash Commands (/)!');
  } catch (error) {
    console.error('❌ Lỗi khi đăng ký Slash Commands:', error);
  }
});

// 3. XỬ LÝ KHI NGUỜI DÙNG DÙNG LỆNH /
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;
  const playerData = getPlayerData(user.id);

  if (commandName === 'f') {
    let poolCa = [...DANH_SACH_CA];
    let multiplierKg = 1;
    let multiplierGold = 1;
    let skillMessage = '';

    if (playerData.buffSkill) {
      skillMessage = ` (Kích hoạt **${playerData.buffSkill.ten}**)`;
      multiplierKg = 1.5;
      playerData.buffSkill = null;
    }

    let rand = Math.random() * 100;
    let caCauDuoc = poolCa[0];
    let tongTyLe = 0;

    for (const ca of poolCa) {
      tongTyLe += ca.tyLe;
      if (rand <= tongTyLe) {
        caCauDuoc = ca;
        break;
      }
    }

    let canNang = (Math.random() * (caCauDuoc.maxKg - caCauDuoc.minKg) + caCauDuoc.minKg) * multiplierKg;
    const canNangFormatted = canNang.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
    const giaTriVang = Math.floor(canNang * caCauDuoc.giaVangPerKg * multiplierGold);

    playerData.inventory.push({ ten: caCauDuoc.ten, kg: canNang, giaVang: giaTriVang });

    return interaction.reply(`🎣 <@${user.id}> quăng cần và kéo lên được **${caCauDuoc.ten}** nặng **${canNangFormatted} CÂN**! (Định giá: 🪙 ${giaTriVang.toLocaleString()} Vàng)${skillMessage}`);
  }

  if (commandName === 'skill') {
    const now = Date.now();
    let cooldown = 30000;

    if (now - playerData.lastSkillTime < cooldown) {
      const wait = Math.ceil((cooldown - (now - playerData.lastSkillTime)) / 1000);
      return interaction.reply({ content: `⏳ Vui lòng chờ ${wait}s để hồi chiêu!`, ephemeral: true });
    }

    const randomOwnedId = playerData.skillsOwned[Math.floor(Math.random() * playerData.skillsOwned.length)];
    const activeSkill = SKILL_DATABASE.find((s) => s.id === randomOwnedId);

    playerData.buffSkill = activeSkill;
    playerData.lastSkillTime = now;

    return interaction.reply(`🧘 <@${user.id}> thi triển **[${activeSkill.ten}]**!${activeSkill.desc}`);
  }

  if (commandName === 'gio') {
    if (playerData.inventory.length === 0) return interaction.reply(`🎒 Giỏ cá trống! Vàng hiện có: 🪙 ${playerData.gold.toLocaleString()}`);
    let listText = playerData.inventory.map((item, i) => `${i + 1}. **${item.ten}** -${item.kg.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Cân`).join('\n');
    return interaction.reply(`🎒 **GIỎ CÁ**:\n${listText}\n\nDùng \`/banca\` để đổi lấy Vàng!`);
  }

  if (commandName === 'banca') {
    if (playerData.inventory.length === 0) return interaction.reply({ content: `❌ Trong giỏ không có cá!`, ephemeral: true });
    let tongTien = 0;
    playerData.inventory.forEach((item) => { tongTien += item.giaVang; });
    playerData.gold += tongTien;
    const count = playerData.inventory.length;
    playerData.inventory = [];
    return interaction.reply(`💵 Đã bán ${count} con cá thu về 🪙 **${tongTien.toLocaleString()} Vàng**!`);
  }

  if (commandName === 'skillshop') {
    const page = interaction.options.getInteger('trang') || 1;
    const itemsPerPage = 5;
    const totalPages = Math.ceil(SKILL_DATABASE.length / itemsPerPage);

    const start = (page - 1) * itemsPerPage;
    const pageItems = SKILL_DATABASE.slice(start, start + itemsPerPage);

    let shopText = `📜 **CỬA HÀNG SKILL VẠN CÂN (Trang ${page}/${totalPages})**\n` +
      `💰 **Vàng:** 🪙 ${playerData.gold.toLocaleString()} Vàng\n--------------------------------------------------\n`;

    pageItems.forEach((sk) => {
      const isOwned = playerData.skillsOwned.includes(sk.id) ? '✅ [ĐÃ SỞ HỮU]' : `🪙 ${sk.gia.toLocaleString()} Vàng`;
      shopText += `**ID ${sk.id}.${sk.ten}**\n👉 *${sk.desc}*\nGiá: **${isOwned}**\n\n`;
    });

    shopText += `--------------------------------------------------\n` +
      `💡 Dùng \`/skillshop trang:2\` để sang trang. Mua skill: \`/muaskill id:<ID>\``;

    return interaction.reply(shopText);
  }

  if (commandName === 'muaskill') {
    const skillId = interaction.options.getInteger('id');

    const targetSkill = SKILL_DATABASE.find((s) => s.id === skillId);
    if (!targetSkill) return interaction.reply({ content: `❌ ID Skill không hợp lệ!`, ephemeral: true });

    if (playerData.skillsOwned.includes(skillId)) return interaction.reply({ content: `✅ Bạn đã học skill này rồi!`, ephemeral: true });
    if (playerData.gold < targetSkill.gia) return interaction.reply({ content: `❌ Bạn thiếu vàng! Cần 🪙 ${targetSkill.gia.toLocaleString()} Vàng.`, ephemeral: true });

    playerData.gold -= targetSkill.gia;
    playerData.skillsOwned.push(skillId);

    return interaction.reply(`🎉 Học thành công **[${targetSkill.ten}]**! Dùng \`/skill\` để sử dụng.`);
  }
});

client.login(process.env.DISCORD_TOKEN);
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ==========================================
// 1. CƠ SỞ DỮ LIỆU GAME (DATABASE & STATE)
// ==========================================
const players = {};
const activeEncounters = {}; // Trạng thái kéo cá cá nhân
let activeDungeon = null;      // Trạng thái Phó Bản Boss toàn Server

const SKILL_DATABASE = [
  { id: 1, ten: '🎋 Tuyệt Kỹ: Khai Môn Khí', desc: '+15% Tỷ lệ gặp cá hiếm', gia: 0 },
  { id: 2, ten: '⚔️ Tuyệt Kỹ: Đoạn Thủy Trảm', desc: '+30 Lực kéo gốc', gia: 0 },
  { id: 3, ten: '🔪 Tuyệt Kỹ: Vạn Cần Đao', desc: 'Gây x1.5 Sát thương lên Cá', gia: 50000 },
  { id: 4, ten: '💥 Tuyệt Kỹ: Trảm Mông Ngư', desc: 'X2 Vàng từ cá dưới 1,000 Cân', gia: 100000 },
  { id: 5, ten: '🌀 Tuyệt Kỹ: Phá Sóng Thần', desc: 'Giảm 50% Tỷ lệ đứt dây câu', gia: 200000 },
];

const SHOP_DIEU_PHAP = [
  { id: 101, ten: '📖 Bí Kíp: Thủy Long Điếu Pháp', gia: 150000, reqLevel: 2, desc: 'Tăng 50 Lực kéo & +20% EXP khi câu' },
  { id: 102, ten: '📜 Bí Kíp: Vạn Cân Quy Tông', gia: 500000, reqLevel: 5, desc: 'Tăng 150 Lực kéo & Giảm 80% đứt dây' },
  { id: 103, ten: '📘 Bí Kíp: Thái Cổ Thần Điếu', gia: 2000000, reqLevel: 10, desc: 'Tăng 500 Lực kéo & X2 Vàng toàn bộ cá' },
];

const DANH_SACH_CA = [
  { id: 'rac_1', ten: '👞 Giày Cao Cổ Đáy Hồ', hp: 100, minKg: 1, maxKg: 5, tyLe: 50, giaVangPerKg: 2, loai: 'Rác' },
  { id: 'thuong_1', ten: '🐟 Cá Rô Cụ "Vững Như Chó Già"', hp: 300, minKg: 10, maxKg: 50, tyLe: 35, giaVangPerKg: 5, loai: 'Thường' },
  { id: 'thuong_2', ten: '🐠 Cá Diếc Tốt Nghiệp Đại Học', hp: 600, minKg: 50, maxKg: 200, tyLe: 10, giaVangPerKg: 10, loai: 'Thường' },
  { id: 'hiem_1', ten: '🦈 Cá Mập Lưỡi Dao Hào Đế', hp: 2000, minKg: 1000, maxKg: 5000, tyLe: 4.5, giaVangPerKg: 25, loai: 'Hiếm' },
  { id: 'than_thoai', ten: '👑 TỐ TỐ THẦN THOẠI - VẠN CÂN CHI VƯƠNG', hp: 10000, minKg: 100000, maxKg: 500000, tyLe: 0.5, giaVangPerKg: 100, loai: 'Thần Thoại' },
];

function getPlayerData(userId) {
  if (!players[userId]) {
    players[userId] = {
      gold: 50000,
      fishingLevel: 1,
      fishingExp: 0,
      dungeonLevel: 1,
      dungeonExp: 0,
      inventory: [],       // Giỏ cá
      items: {             // Tủ đồ mở rộng (Inventory)
        vePhoBan: 0,
        chiaKhoaVoCuc: 0,
        thanDuoc: 0,
      },
      skillsOwned: [1, 2],
      dieuPhapOwned: [],   // Danh sách ID sách đã mua
      dieuPhapStudying: null, // { id, startTime, endTime }
      dieuPhapEquipped: null, // Bí kíp đang trang bị
      lastDaily: 0,
    };
  }
  return players[userId];
}

// Hàm vẽ thanh máu (HP Bar)
function renderHpBar(current, max, size = 10) {
  const percentage = Math.max(0, Math.min(1, current / max));
  const progress = Math.round(size * percentage);
  const emptyProgress = size - progress;
  const progressText = '█'.repeat(progress);
  const emptyProgressText = '░'.repeat(emptyProgress);
  return `[${progressText}${emptyProgressText}] ${current}/${max} HP (${Math.floor(percentage * 100)}%)`;
}

// Hàm tính Lực kéo của người chơi dựa trên Level & Điếu Pháp
function getPlayerPullPower(player) {
  let basePower = 50 + player.fishingLevel * 10;
  if (player.dieuPhapEquipped === 101) basePower += 50;
  if (player.dieuPhapEquipped === 102) basePower += 150;
  if (player.dieuPhapEquipped === 103) basePower += 500;
  return basePower;
}

// Hàm tăng EXP và xử lý Lên Cấp
function addFishingExp(player, exp, message) {
  player.fishingExp += exp;
  const nextLevelExp = player.fishingLevel * 100;
  if (player.fishingExp >= nextLevelExp) {
    player.fishingLevel += 1;
    player.fishingExp -= nextLevelExp;
    return `\n🎉 **LÊN CẤP CÂU CÁ!** Bạn đã đạt **Cấp ${player.fishingLevel}**! (Lực kéo tăng thêm +10)`;
  }
  return '';
}

// ==========================================
// 2. LẮNG NGHE LỆNH TIỀN TỐ (!)
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const userId = message.author.id;
  const player = getPlayerData(userId);

  // ------------------------------------------
  // LỆNH 1: !f (BẮT ĐẦU CÂU CÁ & HIỆN THANH MÁU)
  // ------------------------------------------
  if (command === 'f') {
    if (activeEncounters[userId]) {
      return message.reply('⚠️ Bạn đang trong một cuộc điếu cá! Hãy bấm nút **[🎣 Kéo Cần]** ở tin nhắn trước.');
    }

    // Random Cá theo tỷ lệ
    let rand = Math.random() * 100;
    let ca = DANH_SACH_CA[0];
    let cum = 0;
    for (const c of DANH_SACH_CA) {
      cum += c.tyLe;
      if (rand <= cum) { ca = c; break; }
    }

    const canNang = Math.floor(Math.random() * (ca.maxKg - ca.minKg) + ca.minKg);
    const pullPower = getPlayerPullPower(player);

    activeEncounters[userId] = {
      ca: { ...ca },
      currentHp: ca.hp,
      maxHp: ca.hp,
      kg: canNang,
      pullPower: pullPower,
    };

    const embed = new EmbedBuilder()
      .setTitle(`🎣 CÁ ĐÃ CẮN CÂU: ${ca.ten}!`)
      .setColor(ca.loai === 'Thần Thoại' ? 0xFFD700 : 0x0099FF)
      .setDescription(`**Phẩm chất:** ${ca.loai}\n**Cân nặng ước tính:** ${canNang.toLocaleString()} Cân\n\n**Thanh Máu Cá:**\n\`${renderHpBar(ca.hp, ca.hp)}\`\n\n💡 Bấm nút **[🎣 Kéo Cần]** bên dưới để giật cá!`)
      .setFooter({ text: `Lực kéo hiện tại của bạn: ${pullPower} HP/lượt` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`pull_fish_${userId}`).setLabel('🎣 Kéo Cần!').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`giveup_fish_${userId}`).setLabel('❌ Bỏ Cần').setStyle(ButtonStyle.Danger)
    );

    return message.reply({ embeds: [embed], components: [row] });
  }

  // ------------------------------------------
  // LỆNH 2: !daily (ĐIỂM DANH HÀNG NGÀY)
  // ------------------------------------------
  if (command === 'daily') {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000; // 24 giờ
    if (now - player.lastDaily < cooldown) {
      const wait = Math.ceil((cooldown - (now - player.lastDaily)) / (1000 * 60 * 60));
      return message.reply(`⏳ Bạn đã điểm danh hôm nay rồi! Vui lòng quay lại sau **${wait} giờ**.`);
    }

    const rewardGold = 100000;
    player.gold += rewardGold;
    player.items.vePhoBan += 1;
    player.lastDaily = now;

    return message.reply(`🎁 **ĐIỂM DANH THÀNH CÔNG!**\nBạn nhận được: 🪙 **${rewardGold.toLocaleString()} Vàng** + 🎟️ **1x Vé Phó Bản**.`);
  }

  // ------------------------------------------
  // LỆNH 3: !gacha (QUAY VẬT PHẨM & VÉ PHÓ BẢN)
  // ------------------------------------------
  if (command === 'gacha') {
    const price = 50000;
    if (player.gold < price) return message.reply(`❌ Bạn không đủ tiền! 1 Lượt Gacha tốn 🪙 **50,000 Vàng**.`);

    player.gold -= price;
    const rand = Math.random() * 100;
    let rewardText = '';

    if (rand < 15) {
      player.items.vePhoBan += 1;
      rewardText = '🎟️ **1x Vé Phó Bản Cổ Đại** (Dùng để `/phoban`)';
    } else if (rand < 20) {
      player.items.chiaKhoaVoCuc += 1;
      rewardText = '🗝️ **1x Chìa Khóa Vô Cực**';
    } else if (rand < 50) {
      player.items.thanDuoc += 1;
      rewardText = '🧪 **1x Thần Dược Tăng Lực**';
    } else {
      const bonusGold = Math.floor(Math.random() * 80000) + 20000;
      player.gold += bonusGold;
      rewardText = `🪙 **${bonusGold.toLocaleString()} Vàng**`;
    }

    return message.reply(`🎲 **VÒNG QUAY GACHA VẠN CÂN**\nBạn đã chi 🪙 50,000 Vàng và nhận được: ${rewardText}!`);
  }

  // ------------------------------------------
  // LỆNH 4: !stealfish (TRỘM CÁ NGUỜI KHÁC)
  // ------------------------------------------
  if (command === 'stealfish') {
    const targetUser = message.mentions.users.first();
    if (!targetUser) return message.reply('⚠️ Bạn phải tag người muốn trộm cá! Ví dụ: `!stealfish @User`');
    if (targetUser.id === userId) return message.reply('❌ Bạn không thể tự trộm cá của chính mình!');

    const targetPlayer = getPlayerData(targetUser.id);
    if (targetPlayer.inventory.length === 0) return message.reply(`🎒 Giỏ cá của <@${targetUser.id}> đang trống rỗng!`);

    const success = Math.random() < 0.4; // 40% thành công
    if (success) {
      const stolenIndex = Math.floor(Math.random() * targetPlayer.inventory.length);
      const stolenFish = targetPlayer.inventory.splice(stolenIndex, 1)[0];
      player.inventory.push(stolenFish);
      return message.reply(`🥷 **TRỘM THÀNH CÔNG!** Bạn đã trộm thành công con **${stolenFish.ten}** (${stolenFish.kg.toLocaleString()} Cân) từ giỏ cá của <@${targetUser.id}>!`);
    } else {
      const fine = 30000;
      player.gold = Math.max(0, player.gold - fine);
      targetPlayer.gold += fine;
      return message.reply(`🚨 **BỊ BẮT QUẢ TANG!** Bạn bị phạt 🪙 **30,000 Vàng** bồi thường trực tiếp cho <@${targetUser.id}>!`);
    }
  }

  // ------------------------------------------
  // LỆNH 5: !shopdieuphap & !hocdieuphap
  // ------------------------------------------
  if (command === 'shopdieuphap') {
    let text = `📚 **CỬA HÀNG SÁCH ĐIẾU PHÁP CỔ ĐẠI**\n💰 Vàng hiện có: 🪙 ${player.gold.toLocaleString()}\n--------------------------------------------------\n`;
    SHOP_DIEU_PHAP.forEach((book) => {
      const owned = player.dieuPhapOwned.includes(book.id) ? '✅ [Đã mua]' : `🪙 ${book.gia.toLocaleString()} Vàng`;
      text += `**ID ${book.id}. ${book.ten}** (Yêu cầu Level ${book.reqLevel})\n👉 *${book.desc}*\nGiá: **${owned}**\n\n`;
    });
    text += `💡 *Dùng \`!muadieuphap <ID>\` để mua sách. Sau đó dùng \`!hocdieuphap <ID>\` để bắt đầu Ngộ Đạo (10 giờ).*`;
    return message.reply(text);
  }

  if (command === 'muadieuphap') {
    const bookId = parseInt(args[0]);
    const book = SHOP_DIEU_PHAP.find((b) => b.id === bookId);
    if (!book) return message.reply('❌ ID Sách Điếu Pháp không hợp lệ!');
    if (player.dieuPhapOwned.includes(bookId)) return message.reply('✅ Bạn đã sở hữu cuốn bí kíp này rồi!');
    if (player.fishingLevel < book.reqLevel) return message.reply(`❌ Cấp độ Câu cá của bạn chưa đủ! Cần Level ${book.reqLevel}.`);
    if (player.gold < book.gia) return message.reply(`❌ Bạn thiếu vàng! Cần 🪙 ${book.gia.toLocaleString()} Vàng.`);

    player.gold -= book.gia;
    player.dieuPhapOwned.push(bookId);
    return message.reply(`🎉 Mua thành công **[${book.ten}]**! Dùng \`!hocdieuphap ${bookId}\` để bắt đầu Ngộ Đạo.`);
  }

  if (command === 'hocdieuphap') {
    const bookId = parseInt(args[0]);
    if (!player.dieuPhapOwned.includes(bookId)) return message.reply('❌ Bạn chưa sở hữu bí kíp này!');
    if (player.dieuPhapStudying) return message.reply('🧘 Bạn đang trong quá trình Luyện Cảnh Ngộ Đạo bí kíp khác rồi!');

    const now = Date.now();
    const duration = 10 * 60 * 60 * 1000; // 10 giờ
    player.dieuPhapStudying = {
      id: bookId,
      startTime: now,
      endTime: now + duration,
    };

    return message.reply(`🧘 **BẮT ĐẦU NGỘ ĐẠO (10 GIỜ)**\nBạn đã nhập thất luyện cảnh bí kíp ID **${bookId}**. Dùng \`!xemdieuphap\` để check tiến trình!`);
  }

  if (command === 'xemdieuphap') {
    if (!player.dieuPhapStudying) {
      const equippedText = player.dieuPhapEquipped ? `ID ${player.dieuPhapEquipped}` : 'Chưa trang bị';
      return message.reply(`📜 **BÍ KÍP ĐIẾU PHÁP**:\n- Bí kíp đang trang bị: **${equippedText}**\n- Trạng thái Luyện cảnh: **Không có**.\n\nDùng \`!trangbidieuphap <ID>\` để gắn skill!`);
    }

    const now = Date.now();
    const study = player.dieuPhapStudying;
    if (now >= study.endTime) {
      player.dieuPhapEquipped = study.id;
      player.dieuPhapStudying = null;
      return message.reply(`✨ **NGỘ ĐẠO HOÀN TẤT!** Bạn đã đại thành bí kíp ID **${study.id}** và tự động trang bị!`);
    }

    const remainMin = Math.ceil((study.endTime - now) / (1000 * 60));
    return message.reply(`⏳ **ĐANG TRONG CẢNH GIỚI NGỘ ĐẠO**\nBí kíp ID: **${study.id}**\nThời gian còn lại: **${remainMin} phút** (~${(remainMin/60).toFixed(1)} giờ).`);
  }

  // ------------------------------------------
  // LỆNH 6: !inventory (TỦ ĐỒ MỞ RỘNG)
  // ------------------------------------------
  if (command === 'inventory' || command === 'tu') {
    const embed = new EmbedBuilder()
      .setTitle(`🎒 TỦ ĐỒ CÁ NHÂN: <@${userId}>`)
      .setColor(0x2B2D31)
      .addFields(
        { name: '📊 Cấp Độ', value: `🎣 Câu cá: **Lvl ${player.fishingLevel}** (${player.fishingExp} EXP)\n🏰 Phó bản: **Lvl ${player.dungeonLevel}**`, inline: true },
        { name: '💰 Tài Sản', value: `🪙 **${player.gold.toLocaleString()}** Vàng`, inline: true },
        { name: '🎟️ Vật Phẩm Phó Bản', value: `- Vé Phó Bản: **${player.items.vePhoBan}**\n- Chìa Khóa Vô Cực: **${player.items.chiaKhoaVoCuc}**\n- Thần Dược: **${player.items.thanDuoc}**`, inline: false },
        { name: '📖 Điếu Pháp Trang Bị', value: player.dieuPhapEquipped ? `Bí Kíp ID **${player.dieuPhapEquipped}**` : 'Trống', inline: false }
      );
    return message.reply({ embeds: [embed] });
  }

  // ------------------------------------------
  // LỆNH 7: !gio (GIỎ CÁ) & !banca (BÁN CÁ)
  // ------------------------------------------
  if (command === 'gio') {
    if (player.inventory.length === 0) return message.reply('🎒 Giỏ cá trống!');
    let list = player.inventory.map((item, i) => `${i + 1}. **${item.ten}** - ${item.kg.toLocaleString()} Cân (🪙 ${item.giaVang.toLocaleString()} Vàng)`).join('\n');
    return message.reply(`🎒 **GIỎ CÁ CỦA BẠN**:\n${list}\n\nDùng \`!banca\` để bán toàn bộ!`);
  }

  if (command === 'banca') {
    if (player.inventory.length === 0) return message.reply('❌ Giỏ cá không có gì để bán!');
    let tongVang = 0;
    player.inventory.forEach(i => tongVang += i.giaVang);
    player.gold += tongVang;
    const count = player.inventory.length;
    player.inventory = [];
    return message.reply(`💵 Đã bán **${count} con cá** và thu về 🪙 **${tongVang.toLocaleString()} Vàng**!`);
  }
});

// ==========================================
// 3. XỬ LÝ SỰ KIỆN NÚT BẤM (BUTTON KÉO CÁ)
// ==========================================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const [action, type, targetUserId] = interaction.customId.split('_');
  const userId = interaction.user.id;

  if (targetUserId && targetUserId !== userId) {
    return interaction.reply({ content: '❌ Đây không phải lượt kéo cá của bạn!', ephemeral: true });
  }

  const player = getPlayerData(userId);
  const encounter = activeEncounters[userId];

  if (action === 'giveup') {
    delete activeEncounters[userId];
    return interaction.update({ content: '❌ Bạn đã cắt dây thả cá đi!', embeds: [], components: [] });
  }

  if (action === 'pull') {
    if (!encounter) return interaction.reply({ content: '❌ Cuộc điếu cá này đã kết thúc!', ephemeral: true });

    // Tỷ lệ đứt dây 10%
    if (Math.random() < 0.10) {
      delete activeEncounters[userId];
      return interaction.update({ content: `💥 **ĐỨT DÂY CÂU!** Con cá **${encounter.ca.ten}** đã quẫy đuôi làm đứt dây câu và tẩu thoát!`, embeds: [], components: [] });
    }

    // Trừ HP cá
    encounter.currentHp -= encounter.pullPower;

    // Cá hết HP -> CÂU THÀNH CÔNG!
    if (encounter.currentHp <= 0) {
      delete activeEncounters[userId];
      const giaVang = encounter.kg * encounter.ca.giaVangPerKg;
      player.inventory.push({ ten: encounter.ca.ten, kg: encounter.kg, giaVang: giaVang });

      const expGain = encounter.ca.loai === 'Thần Thoại' ? 200 : encounter.ca.loai === 'Hiếm' ? 80 : 25;
      const levelUpMsg = addFishingExp(player, expGain, interaction);

      return interaction.update({
        content: `🎉 **THÀNH CÔNG KÉO LÊN!**\n<@${userId}> đã thu phục thành công **${encounter.ca.ten}**!\n- **Cân nặng:** ${encounter.kg.toLocaleString()} Cân\n- **Định giá:** 🪙 ${giaVang.toLocaleString()} Vàng\n- **EXP nhận được:** +${expGain} EXP${levelUpMsg}`,
        embeds: [],
        components: []
      });
    }

    // Cá chưa hết HP -> Cập nhật thanh máu mới
    const updatedEmbed = new EmbedBuilder()
      .setTitle(`🎣 ĐANG KÉO: ${encounter.ca.ten}!`)
      .setColor(0x0099FF)
      .setDescription(`💥 Bạn gây **${encounter.pullPower} Sát Thương**!\n\n**Thanh Máu Cá:**\n\`${renderHpBar(encounter.currentHp, encounter.maxHp)}\`\n\n⚡ Tiếp tục bấm **[🎣 Kéo Cần]**!`);

    return interaction.update({ embeds: [updatedEmbed] });
  }
});

client.login(process.env.DISCORD_TOKEN);
      const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, REST, Routes } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Database giả lập lưu trữ thông tin người chơi
const players = new Map();

function getPlayer(userId) {
    if (!players.has(userId)) {
        players.set(userId, {
            coins: 1000,
            skill: null,
            inventory: []
        });
    }
    return players.get(userId);
}

// ================= SANH SÁCH CÁ =================
const FISH_LIST = [
    { name: "Cá Rô Đồng", price: 50, rarity: "Phổ thông" },
    { name: "Cá Chép Bạc", price: 150, rarity: "Thường" },
    { name: "Cá Trắm Đen", price: 500, rarity: "Hiếm" },
    { name: "Cá Hồi Hoàng Gia", price: 2000, rarity: "Cực hiếm" },
    { name: "Long Ngư Thần Thoại", price: 10000, rarity: "Huyền thoại" }
];

// ================= DANH SÁCH KỸ NĂNG (SKILLS) =================
const ALL_SKILLS = [
    // Tường Vân 18
    "Vững như lão cẩu", "Câu cá bằng động cơ", "Bà già bại trận", "Soái ca hạ sơn", 
    "Hồi thủ thao", "Bé lan đi xe đạp", "Phi thiên vô cực điếu", "Lão nãi nãi chui vào chăn", 
    "Điếu long bàn hổ", "Đánh bại ngàn quân", "Công kê hạ đảng", "Toán thiên hầu chi điếu", 
    "Nhất điếu khai thiên môn",

    // Bản đặc biệt Nhất Điếu Khai Thiên Môn
    "Ngũ điệu hợp nhất", "Thập điệu hợp nhất", "Phá phủ trầm châu", "Phá phủ trầm châu tam liên quá",

    // Thục Đạo Sơn Điếu Pháp
    "Can môn đạo", "Can môn quan", "Can môn khai", "Can môn đoạn",

    // Thất Thương Điếu Pháp
    "Thất thương - Nhất thức", "Thất thương - Nhị thức", "Thất thương - Tam thức", 
    "Thất thương - Tứ thức", "Thất thương - Ngũ thức", "Thất thương - Lục thức", 
    "Thất thương - Thất thức", "Thất điếu quy y - Trung trương",

    // Thái Cực Điếu Pháp
    "Thái cực quyền pháp", "Thái cực bát quái điếu", "Thái cực âm dương cửu cung điếu", 
    "Thái cực điếu pháp, bát quái bát môn, thái cực 8 phân",

    // Skill khác
    "Nhất điếu độc tôn"
];

const ADMIN_SKILLS = [
    "Phi thiên vô cực áo nghĩa tối cao - Heavenbound Infiniti",
    "Toán thiên hầu chi điếu áo nghĩa tối cao - Celestial Ape's Heavenbreaker",
    "Đả ngư phụng pháp cấm kỵ áo nghĩa",
    "Nhất điếu khai thiên môn cấm kỵ tối cao áo nghĩa - Celestial Gatebreaker",
    "Sở tân điếu - Chu Xin Diao",
    "Bá vương đoạn",
    "Cấm kỵ áo nghĩa, bá vương thức: Bá hải",
    "Thái cực thần điếu"
];

// ================= KHỞI TẠO COMMANDS =================
const commands = [
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Hiển thị bảng hướng dẫn và danh sách lệnh'),
    
    new SlashCommandBuilder()
        .setName('cauca')
        .setDescription('Bắt đầu thả câu tìm cá'),
    
    new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Mở Cửa Hàng Điếu Pháp (Giá: 500,000 Xu)'),

    new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Xem thông tin cá nhân, túi cá và kỹ năng đang có')
].map(command => command.toJSON());

// Register Slash Commands
const rest = new REST({ version: '10' }).setToken('YOUR_BOT_TOKEN_HERE');

client.once('ready', async () => {
    console.log(`🤖 Bot đã đăng nhập thành công với tên: ${client.user.tag}`);
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('✅ Đã đăng ký thành công các lệnh Slash (/help, /cauca, /shop, /profile)');
    } catch (error) {
        console.error('❌ Lỗi khi đăng ký lệnh:', error);
    }
});

// ================= XỬ LÝ LỆNH =================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, user } = interaction;
    const player = getPlayer(user.id);

    // 1. Lệnh /help
    if (commandName === 'help') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('📜 BẢNG HƯỚNG DẪN BẮT CÁ & ĐIẾU PHÁP')
            .setColor(0x00AE89)
            .setDescription('Chào mừng bạn đến với thế giới Điếu Pháp!')
            .addFields(
                { name: '/cauca', value: 'Thả câu để bắt cá. Nếu có kỹ năng, sức mạnh câu cá sẽ tăng lên!' },
                { name: '/shop', value: 'Mua Bí Kíp Điếu Pháp ngẫu nhiên với giá **500,000 xu** (Chỉ sở hữu tối đa 1 skill).' },
                { name: '/profile', value: 'Xem số xu, túi cá và kỹ năng bạn đang luyện.' },
                { name: '/help', value: 'Hiển thị bảng trợ giúp này.' }
            )
            .setFooter({ text: 'Chúc bạn câu được Long Ngư Thần Thoại!' });

        return interaction.reply({ embeds: [helpEmbed] });
    }

    // 2. Lệnh /cauca
    if (commandName === 'cauca') {
        let skillBonus = 1;
        let skillMsg = "";

        if (player.skill) {
            skillBonus = 2; // Kích hoạt kỹ năng nhân 2 giá trị bán hoặc may mắn
            skillMsg = `\n🔥 **Kích hoạt tuyệt kỹ:** \`${player.skill}\`!`;
        }

        // Tỷ lệ bắt cá
        const rand = Math.random();
        let fish;
        if (rand < 0.5) fish = FISH_LIST[0];
        else if (rand < 0.75) fish = FISH_LIST[1];
        else if (rand < 0.90) fish = FISH_LIST[2];
        else if (rand < 0.98) fish = FISH_LIST[3];
        else fish = FISH_LIST[4];

        const finalPrice = fish.price * skillBonus;
        player.coins += finalPrice;
        player.inventory.push(fish.name);

        const caucaEmbed = new EmbedBuilder()
            .setTitle('🎣 KẾT QUẢ CÂU CÁ')
            .setColor(0x3498DB)
            .setDescription(`Bạn đã thả câu và bắt được: **${fish.name}** (${fish.rarity})!${skillMsg}`)
            .addFields(
                { name: 'Giá trị thu được', value: `+${finalPrice} Xu`, inline: true },
                { name: 'Số xu hiện tại', value: `${player.coins} Xu`, inline: true }
            );

        return interaction.reply({ embeds: [caucaEmbed] });
    }

    // 3. Lệnh /shop
    if (commandName === 'shop') {
        const SHOP_PRICE = 500000;

        if (player.coins < SHOP_PRICE) {
            return interaction.reply({ 
                content: `❌ Bạn không đủ tiền! Cần **${SHOP_PRICE.toLocaleString()} Xu** để lĩnh ngộ Điếu Pháp. Sống bằng nghề câu cá tiếp đi nhé! (Số xu hiện tại: ${player.coins.toLocaleString()})`, 
                ephemeral: true 
            });
        }

        // Trừ tiền & chọn skill ngẫu nhiên
        player.coins -= SHOP_PRICE;
        const randomSkill = ALL_SKILLS[Math.floor(Math.random() * ALL_SKILLS.length)];
        player.skill = randomSkill;

        const shopEmbed = new EmbedBuilder()
            .setTitle('🏛️ TỔNG CÁC ĐIẾU PHÁP - BÁN BÍ KÍP')
            .setColor(0xF1C40F)
            .setDescription(`🎉 Lĩnh ngộ thành công! Bạn đã tốn **${SHOP_PRICE.toLocaleString()} Xu** và học được kỹ năng:`)
            .addFields({ name: '✨ Kỹ năng mới', value: `**${randomSkill}**` })
            .setFooter({ text: 'Lưu ý: Bạn chỉ có thể sở hữu duy nhất 1 kỹ năng tại một thời điểm.' });

        return interaction.reply({ embeds: [shopEmbed] });
    }

    // 4. Lệnh /profile
    if (commandName === 'profile') {
        const profileEmbed = new EmbedBuilder()
            .setTitle(`👤 THÔNG TIN CỦA ${user.username.toUpperCase()}`)
            .setColor(0x9B59B6)
            .addFields(
                { name: '💰 Số xu', value: `${player.coins.toLocaleString()} Xu`, inline: true },
                { name: '☯️ Kỹ năng đang có', value: player.skill ? `\`${player.skill}\`` : 'Chưa có (Hãy mua ở /shop)', inline: true },
                { name: '🎒 Túi cá gần đây', value: player.inventory.length > 0 ? player.inventory.slice(-5).join(', ') : 'Chưa câu được cá nào.' }
            );

        return interaction.reply({ embeds: [profileEmbed] });
    }
});

// Lệnh dành riêng cho Admin để gán Admin Skill
client.on('messageCreate', async message => {
    if (message.content.startsWith('!giveadmin skill')) {
        // Kiểm tra quyền Admin (ví dụ check ID)
        const player = getPlayer(message.author.id);
        const randomAdminSkill = ADMIN_SKILLS[Math.floor(Math.random() * ADMIN_SKILLS.length)];
        player.skill = randomAdminSkill;
        
        message.reply(`⚡ **[ADMIN BÍ TRUYỀN]** Bạn đã nhận tuyệt kỹ Cấm Kỵ: **${randomAdminSkill}**!`);
    }
});

client.login('YOUR_BOT_TOKEN_HERE');
// ==========================================
// 1. CẤU HÌNH ID OWNER (CHỈ MÌNH BẠN SỬ DỤNG DƯỢC)
// ==========================================
// Thay ID bên dưới bằng Discord User ID của bạn
const BOT_OWNER_ID = 'THAY_DISCORD_USER_ID_CUA_BAN_VAO_DAY'; 

// Danh sách Skill Admin Bá Đạo
const ADMIN_SKILLS = [
  "Phi thiên vô cực áo nghĩa tối cao - Heavenbound Infiniti",
  "Toán thiên hầu chi điếu áo nghĩa tối cao - Celestial Ape's Heavenbreaker",
  "Đả ngư phụng pháp cấm kỵ áo nghĩa",
  "Nhất điếu khai thiên môn cấm kỵ tối cao áo nghĩa - Celestial Gatebreaker",
  "Sở tân điếu - Chu Xin Diao",
  "Bá vương đoạn",
  "Cấm kỵ áo nghĩa, bá vương thức: Bá hải",
  "Thái cực thần điếu"
];

// ==========================================
// 2. XỬ LÝ LỆNH !giveadminskill
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ------------------------------------------
  // LỆNH EXCLUSIVE: !giveadminskill @user
  // ------------------------------------------
  if (command === 'giveadminskill') {
    // 🔒 KIỂM TRA QUYỀN OWNER: Chỉ cho phép ID của Owner thực thi
    if (message.author.id !== BOT_OWNER_ID) {
      return message.reply('⛔ **TỪ CHỐI TRUY CẬP:** Chỉ có Chủ Nhân (Owner) duy nhất của bot mới có quyền dùng lệnh cấm kỵ này!');
    }

    // Kiểm tra xem Owner có tag ai không
    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      return message.reply('⚠️ **CÚ PHÁP CHƯA ĐÚNG:** Hãy tag người muốn cấp Admin Skill! Ví dụ: `!giveadminskill @NguoiChoi`');
    }

    // Lấy dữ liệu người chơi được chọn
    const targetPlayer = getPlayerData(targetUser.id);

    // Random lấy 1 Skill Admin Bá Đạo
    const randomAdminSkill = ADMIN_SKILLS[Math.floor(Math.random() * ADMIN_SKILLS.length)];
    
    // Gán trực tiếp Skill Admin vào nhân vật
    targetPlayer.skill = randomAdminSkill;

    return message.reply({
      content: `⚡ **[BAN THƯỞNG TỪ OWNER]**\nChủ nhân <@${message.author.id}> đã trao Tuyệt Kỹ Cấm Kỵ **[${randomAdminSkill}]** cho <@${targetUser.id}>!`
    });
  }
});
require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, REST, Routes } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 🔑 ID OWNER ĐÃ ĐƯỢC CHỈNH CHÍNH XÁC:
const BOT_OWNER_ID = '1502678298214535299';

// Danh sách GIF khi câu cá mạnh/dùng skill mạnh
const HEAVY_FISH_GIFS = [
    'https://klipy.com/gifs/cau-ca-van-can-3',
    'https://klipy.com/gifs/cau-ca-van-can',
    'https://klipy.com/gifs/cau-ca-van-can-4',
    'https://klipy.com/gifs/cuu-ngu-chi-ton-dieu-1',
    'https://klipy.com/gifs/caucanvancan'
];

// GIF cố định cho 2 skill đặc biệt
const SPECIAL_SKILL_GIFS = {
    "Thái cực quyền pháp": "https://klipy.com/gifs/cau-ca-van-can",
    "Nhất điếu khai thiên môn cấm kỵ tối cao áo nghĩa - Celestial Gatebreaker": "https://klipy.com/gifs/cuu-ngu-chi-ton-dieu-1"
};

const players = new Map();
const activeEncounters = new Map(); // Luồng cá đang câu của từng người chơi

function getPlayer(userId) {
    if (!players.has(userId)) {
        players.set(userId, {
            coins: 1000,
            skill: null,
            inventory: [],
            rodDamage: 10,
            rodName: "Cần Cù Cần Cù (Cơ bản)"
        });
    }
    return players.get(userId);
}

// Cửa hàng Cần câu
const ROD_SHOP = [
    { name: "Cần Bằng Trúc", price: 5000, damage: 25 },
    { name: "Cần Carbon Cao Cấp", price: 20000, damage: 60 },
    { name: "Thần Điếu Kim Cương", price: 100000, damage: 150 },
    { name: "Cửu Long Trầm Hương Cần", price: 500000, damage: 400 }
];

const FISH_LIST = [
    { name: "Cá Rô Đồng", price: 50, rarity: "Phổ thông", hp: 30, isHeavy: false },
    { name: "Cá Chép Bạc", price: 150, rarity: "Thường", hp: 80, isHeavy: false },
    { name: "Cá Trắm Đen", price: 500, rarity: "Hiếm", hp: 200, isHeavy: true },
    { name: "Cá Hồi Hoàng Gia", price: 2000, rarity: "Cực hiếm", hp: 500, isHeavy: true },
    { name: "Long Ngư Thần Thoại", price: 10000, rarity: "Huyền thoại", hp: 1200, isHeavy: true }
];

const ALL_SKILLS = [
    "Vững như lão cẩu", "Câu cá bằng động cơ", "Bà già bại trận", "Soái ca hạ sơn", 
    "Hồi thủ thao", "Bé lan đi xe đạp", "Phi thiên vô cực điếu", "Lão nãi nãi chui vào chăn", 
    "Điếu long bàn hổ", "Đánh bại ngàn quân", "Công kê hạ đảng", "Toán thiên hầu chi điếu", 
    "Nhất điếu khai thiên môn", "Ngũ điệu hợp nhất", "Thập điệu hợp nhất", "Phá phủ trầm châu", 
    "Phá phủ trầm châu tam liên quá", "Can môn đạo", "Can môn quan", "Can môn khai", "Can môn đoạn",
    "Thất thương - Nhất thức", "Thất thương - Nhị thức", "Thất thương - Tam thức", 
    "Thất thương - Tứ thức", "Thất thương - Ngũ thức", "Thất thương - Lục thức", 
    "Thất thương - Thất thức", "Thất điếu quy y - Trung trương", "Thái cực quyền pháp", 
    "Thái cực bát quái điếu", "Thái cực âm dương cửu cung điếu", 
    "Thái cực điếu pháp, bát quái bát môn, thái cực 8 phân", "Nhất điếu độc tôn"
];

const ADMIN_SKILLS = [
    "Phi thiên vô cực áo nghĩa tối cao - Heavenbound Infiniti",
    "Toán thiên hầu chi điếu áo nghĩa tối cao - Celestial Ape's Heavenbreaker",
    "Đả ngư phụng pháp cấm kỵ áo nghĩa",
    "Nhất điếu khai thiên môn cấm kỵ tối cao áo nghĩa - Celestial Gatebreaker",
    "Sở tân điếu - Chu Xin Diao", "Bá vương đoạn", "Cấm kỵ áo nghĩa, bá vương thức: Bá hải", "Thái cực thần điếu"
];

// Khởi tạo Slash Commands
const commands = [
    new SlashCommandBuilder().setName('help').setDescription('Xem hướng dẫn trò chơi'),
    new SlashCommandBuilder().setName('cauca').setDescription('Thả câu tìm cá (Bắt đầu trận chiến)'),
    new SlashCommandBuilder().setName('keo').setDescription('Kéo cá bằng lực cần câu'),
    new SlashCommandBuilder().setName('useskill').setDescription('Dùng kỹ năng Điếu Pháp để dồn sát thương cực lớn'),
    new SlashCommandBuilder().setName('rodshop').setDescription('Xem và mua Cần Câu tăng damage'),
    new SlashCommandBuilder().setName('shop').setDescription('Mua Bí Kíp Điếu Pháp ngẫu nhiên (500,000 Xu)'),
    new SlashCommandBuilder().setName('profile').setDescription('Xem trang bị, kỹ năng và tiền')
].map(c => c.toJSON());

client.once('ready', async () => {
    console.log(`🤖 Bot Hàn Bối Tháp đã sẵn sàng: ${client.user.tag}`);
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Đăng ký Slash Commands thành công!');
    } catch (err) {
        console.error('❌ Lỗi đăng ký command:', err);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, user } = interaction;
    const player = getPlayer(user.id);

    // 1. Help
    if (commandName === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('📜 HƯỚNG DẪN CÂU CÁ & ĐIẾU PHÁP')
            .setColor(0x00AE89)
            .addFields(
                { name: '/cauca', value: 'Thả câu để phát hiện cá.' },
                { name: '/keo', value: 'Kéo cá, gây damage dựa vào Cần Cần.' },
                { name: '/useskill', value: 'Sử dụng kỹ năng Điếu Pháp dồn sát thương mạnh.' },
                { name: '/rodshop', value: 'Cửa hàng nâng cấp Cần Câu tăng sát thương.' },
                { name: '/shop', value: 'Mua tuyệt kỹ Điếu Pháp (500,000 Xu).' },
                { name: '!giveadminskill @user', value: 'Lệnh độc quyền Owner gán Cấm Kỵ Skill.' }
            );
        return interaction.reply({ embeds: [embed] });
    }

    // 2. Rodshop
    if (commandName === 'rodshop') {
        let msg = "🎣 **CỬA HÀNG CẦN CÂU**\n\n";
        ROD_SHOP.forEach((rod, index) => {
            msg += `**${index + 1}.${rod.name}**\n- Sát thương: \`${rod.damage} HP\`\n- Giá: \`${rod.price.toLocaleString()} Xu\`\n\n`;
        });
        msg += "*Gõ lệnh `/buyrod <stt>` để mua (Ví dụ: Mua rod 1, 2, 3...)*";
        return interaction.reply({ content: msg });
    }

    // 3. Cầu cá
    if (commandName === 'cauca') {
        if (activeEncounters.has(user.id)) {
            return interaction.reply({ content: '⚠️ Bạn đang trong một trận kéo cá! Hãy dùng `/keo` hoặc `/useskill` để rút máu cá.', ephemeral: true });
        }

        const rand = Math.random();
        let fishData;
        if (rand < 0.4) fishData = FISH_LIST[0];
        else if (rand < 0.7) fishData = FISH_LIST[1];
        else if (rand < 0.88) fishData = FISH_LIST[2];
        else if (rand < 0.97) fishData = FISH_LIST[3];
        else fishData = FISH_LIST[4];

        activeEncounters.set(user.id, {
            fish: fishData,
            currentHP: fishData.hp
        });

        const embed = new EmbedBuilder()
            .setTitle('🎣 Cá Đã Cắn Câu!')
            .setColor(0xE67E22)
            .setDescription(`Bạn phát hiện một con **${fishData.name}** (${fishData.rarity})!\n❤️ **Máu cá (HP):** \`${fishData.hp}/${fishData.hp}\``)
            .setFooter({ text: 'Dùng /keo hoặc /useskill để rút máu cá!' });

        return interaction.reply({ embeds: [embed] });
    }

    // 4. Kéo cá
    if (commandName === 'keo') {
        const encounter = activeEncounters.get(user.id);
        if (!encounter) {
            return interaction.reply({ content: '❌ Bạn chưa thả câu! Hãy dùng `/cauca` trước.', ephemeral: true });
        }

        const dmg = player.rodDamage;
        encounter.currentHP -= dmg;

        if (encounter.currentHP <= 0) {
            player.coins += encounter.fish.price;
            player.inventory.push(encounter.fish.name);
            activeEncounters.delete(user.id);

            const embed = new EmbedBuilder()
                .setTitle('🎉 ĐÃ CÂU THÀNH CÔNG!')
                .setColor(0x2ECC71)
                .setDescription(`Bạn đã thu phục thành công **${encounter.fish.name}**!\n💰 **Nhận được:** \`+${encounter.fish.price.toLocaleString()} Xu\``);

            if (encounter.fish.isHeavy) {
                const randomGif = HEAVY_FISH_GIFS[Math.floor(Math.random() * HEAVY_FISH_GIFS.length)];
                embed.setImage(randomGif);
            }

            return interaction.reply({ embeds: [embed] });
        } else {
            return interaction.reply({ content: `💥 Bạn kéo cần gây **${dmg} damage**! Máu cá **${encounter.fish.name}** còn lại: \`${encounter.currentHP}/${encounter.fish.hp} HP\`.` });
        }
    }

    // 5. Use Skill
    if (commandName === 'useskill') {
        const encounter = activeEncounters.get(user.id);
        if (!encounter) {
            return interaction.reply({ content: '❌ Bạn chưa thả câu! Hãy dùng `/cauca` trước.', ephemeral: true });
        }
        if (!player.skill) {
            return interaction.reply({ content: '❌ Bạn chưa học kỹ năng Điếu Pháp nào! Mua tại `/shop`.', ephemeral: true });
        }

        const skillDmg = player.rodDamage * 3 + 50; // Damage skill gấp 3 lần cần + 50
        encounter.currentHP -= skillDmg;

        const embed = new EmbedBuilder()
            .setTitle(`🔥 THI THỐ TUYỆT KỸ: ${player.skill}!`)
            .setColor(0x9B59B6)
            .setDescription(`Tuyệt kỹ tung ra gây **${skillDmg} damage** chí mạng!`);

        // Check GIF cho 2 Skill Đặc Biệt
        if (SPECIAL_SKILL_GIFS[player.skill]) {
            embed.setImage(SPECIAL_SKILL_GIFS[player.skill]);
        }

        if (encounter.currentHP <= 0) {
            player.coins += encounter.fish.price;
            player.inventory.push(encounter.fish.name);
            activeEncounters.delete(user.id);

            embed.addFields({ name: '🏆 KẾT QUẢ', value: `Cá **${encounter.fish.name}** đã bị khuất phục! Bạn nhận \`+${encounter.fish.price.toLocaleString()} Xu\`.` });

            if (encounter.fish.isHeavy && !SPECIAL_SKILL_GIFS[player.skill]) {
                const randomGif = HEAVY_FISH_GIFS[Math.floor(Math.random() * HEAVY_FISH_GIFS.length)];
                embed.setImage(randomGif);
            }

            return interaction.reply({ embeds: [embed] });
        } else {
            embed.addFields({ name: '❤️ Máu cá còn lại', value: `\`${encounter.currentHP}/${encounter.fish.hp} HP\`` });
            return interaction.reply({ embeds: [embed] });
        }
    }

    // 6. Shop skill
    if (commandName === 'shop') {
        if (player.coins < 500000) {
            return interaction.reply({ content: `❌ Cần **500,000 Xu** để mua bí kíp. Bạn hiện có \`${player.coins.toLocaleString()} Xu\`.`, ephemeral: true });
        }
        player.coins -= 500000;
        const randSkill = ALL_SKILLS[Math.floor(Math.random() * ALL_SKILLS.length)];
        player.skill = randSkill;
        return interaction.reply({ content: `🎉 Bạn đã tiêu **500,000 Xu** và học thành công kỹ năng: **${randSkill}**!` });
    }

    // 7. Profile
    if (commandName === 'profile') {
        const embed = new EmbedBuilder()
            .setTitle(`👤 THÔNG TIN CỦA ${user.username}`)
            .setColor(0x34495E)
            .addFields(
                { name: '💰 Xu', value: `${player.coins.toLocaleString()} Xu`, inline: true },
                { name: '🎣 Cần câu', value: `${player.rodName} (Dmg:${player.rodDamage})`, inline: true },
                { name: '☯️ Kỹ năng', value: player.skill ? `\`${player.skill}\`` : 'Chưa có', inline: true }
            );
        return interaction.reply({ embeds: [embed] });
    }
});

// Admin Command dành riêng cho ID Owner
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!giveadminskill')) {
        if (message.author.id !== BOT_OWNER_ID) {
            return message.reply('❌ **Từ chối truy cập:** Bạn không phải Owner!');
        }

        const targetUser = message.mentions.users.first() || message.author;
        const targetPlayer = getPlayer(targetUser.id);
        
        const randomAdminSkill = ADMIN_SKILLS[Math.floor(Math.random() * ADMIN_SKILLS.length)];
        targetPlayer.skill = randomAdminSkill;
        
        return message.reply(`⚡ **[ADMIN BÍ TRUYỀN]** Đã trao Cấm Kỵ Skill **"${randomAdminSkill}"** cho <@${targetUser.id}>!`);
    }
});

client.login(process.env.DISCORD_TOKEN);
                                 
