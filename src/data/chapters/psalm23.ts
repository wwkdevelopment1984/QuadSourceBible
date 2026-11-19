import type { ChapterData, ParallelVerse } from '../../types/scripture.ts';

export const PSALM_23_VERSES: ParallelVerse[] = [
  {
    verseNumber: 1,
    chineseCunp: '耶和華是我的牧者，我必不致缺乏。',
    kjvText: 'The LORD is my shepherd; I shall not want.',
    jstText: 'The Lord is my shepherd; I shall not want.',
    jstChinese: '耶和華是我的牧者，我必不致缺乏。',
    isDiffFromKjv: false,
    notes: 'Davidic psalm of profound trust in Jehovah as divine shepherd.',
  },
  {
    verseNumber: 2,
    chineseCunp: '他使我躺臥在青草地上，領我在可安歇的水邊。',
    kjvText: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.',
    jstText: 'He maketh me to lie down in green pastures; he leadeth me beside the still waters.',
    jstChinese: '他使我躺臥在青草地上，領我在可安歇的水邊。',
    isDiffFromKjv: false,
  },
  {
    verseNumber: 3,
    chineseCunp: '他使我的靈魂甦醒，為自己的名引導我走義路。',
    kjvText: 'He restoreth my soul: he leadeth me in the paths of righteousness for his name\'s sake.',
    jstText: 'He restoreth my soul; he leadeth me in the paths of righteousness for his name\'s sake.',
    jstChinese: '他使我的靈魂甦醒，為自己的名引導我走義路。',
    isDiffFromKjv: false,
  },
  {
    verseNumber: 4,
    chineseCunp: '我雖然行過死蔭的幽谷，也不怕遭害，因為你與我同在；你的杖，你的竿，都安慰我。',
    kjvText: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.',
    jstText: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil; for thou art with me; thy rod and thy staff they comfort me.',
    jstChinese: '是的，我雖然行過死蔭的幽谷，也不怕遭害，因為你與我同在；你的杖，你的竿，都安慰我。',
    isDiffFromKjv: false,
  },
  {
    verseNumber: 5,
    chineseCunp: '在我敵人面前，你為我擺設筵席；你用油膏了我的頭，使我的福杯滿溢。',
    kjvText: 'Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.',
    jstText: 'Thou preparest a table before me in the presence of mine enemies; thou anointest my head with oil; my cup runneth over.',
    jstChinese: '在我敵人面前，你為我擺設筵席；你用油膏了我的頭，使我的福杯滿溢。',
    isDiffFromKjv: false,
  },
  {
    verseNumber: 6,
    chineseCunp: '我一生一世必有恩惠慈愛隨著我；我且要住在耶和華的殿中，直到永遠。',
    kjvText: 'Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.',
    jstText: 'Surely goodness and mercy shall follow me all the days of my life; and I will dwell in the house of the Lord for ever.',
    jstChinese: '確實，善惠與慈愛必一生一世伴隨著我；我且要住在耶和華的殿中，直到永遠。',
    isDiffFromKjv: false,
  },
];

export const PSALM_CHAPTER_23: ChapterData = {
  bookId: 'PSA',
  chapterNumber: 23,
  bookName: 'Psalms',
  chineseBookName: '詩篇',
  totalVerses: 6,
  sourceUrls: {
    churchKjv: 'https://www.churchofjesuschrist.org/study/scriptures/ot/ps/23?lang=eng',
    centerplaceJst: 'https://www.centerplace.org/hs/iv/default.htm',
    bibleComChinese: 'https://www.bible.com/bible/46/PSA.23.CUNP-%E7%A5%9E',
  },
  verses: PSALM_23_VERSES,
};
