import {
  ContentStatus,
  JlptLevel,
} from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

const grammar = [
  {
    code: 'n5-desu',
    pattern: '～です',
    meaningVi: 'là / thì / ở dạng lịch sự',
    meaningEn: 'polite copula: is / am / are',
    explanationVi: 'Dùng ở cuối câu danh từ hoặc tính từ để tạo sắc thái lịch sự.',
    formation: 'Danh từ / tính từ + です',
    tags: ['polite', 'copula'],
    examples: [
      ['私は学生です。', 'Tôi là học sinh.', 'I am a student.'],
      ['今日は暑いです。', 'Hôm nay trời nóng.', 'It is hot today.'],
    ],
  },
  {
    code: 'n5-masu',
    pattern: '～ます',
    meaningVi: 'đuôi động từ lịch sự',
    meaningEn: 'polite verb ending',
    explanationVi: 'Dùng để nói hành động ở phong cách lịch sự.',
    formation: 'Động từ dạng ます',
    tags: ['polite', 'verb'],
    examples: [
      ['毎日日本語を勉強します。', 'Mỗi ngày tôi học tiếng Nhật.', 'I study Japanese every day.'],
      ['六時に起きます。', 'Tôi thức dậy lúc 6 giờ.', 'I wake up at six.'],
    ],
  },
  {
    code: 'n5-wa',
    pattern: '～は',
    meaningVi: 'trợ từ chủ đề',
    meaningEn: 'topic marker',
    explanationVi: 'Đánh dấu chủ đề đang được nói tới trong câu.',
    formation: 'Danh từ + は + thông tin về chủ đề',
    tags: ['particle', 'topic'],
    examples: [
      ['私はベトナム人です。', 'Tôi là người Việt Nam.', 'I am Vietnamese.'],
      ['この本は面白いです。', 'Quyển sách này thú vị.', 'This book is interesting.'],
    ],
  },
  {
    code: 'n5-ga',
    pattern: '～が',
    meaningVi: 'trợ từ chủ ngữ / nhấn mạnh chủ thể',
    meaningEn: 'subject marker',
    explanationVi: 'Đánh dấu chủ ngữ hoặc thông tin mới được nhấn mạnh.',
    formation: 'Danh từ + が + vị ngữ',
    tags: ['particle', 'subject'],
    examples: [
      ['猫がいます。', 'Có một con mèo.', 'There is a cat.'],
      ['誰が来ますか。', 'Ai sẽ đến?', 'Who will come?'],
    ],
  },
  {
    code: 'n5-o',
    pattern: '～を',
    meaningVi: 'trợ từ tân ngữ',
    meaningEn: 'object marker',
    explanationVi: 'Đánh dấu đối tượng trực tiếp của hành động.',
    formation: 'Danh từ + を + động từ',
    tags: ['particle', 'object'],
    examples: [
      ['ご飯を食べます。', 'Tôi ăn cơm.', 'I eat rice.'],
      ['本を読みます。', 'Tôi đọc sách.', 'I read a book.'],
    ],
  },
  {
    code: 'n5-ni',
    pattern: '～に',
    meaningVi: 'chỉ thời điểm / đích đến / vị trí tồn tại',
    meaningEn: 'time / destination / existence marker',
    explanationVi: 'Dùng với thời điểm, đích đến hoặc nơi tồn tại của người/vật.',
    formation: 'Danh từ + に + động từ',
    tags: ['particle', 'time', 'destination'],
    examples: [
      ['七時に起きます。', 'Tôi dậy lúc 7 giờ.', 'I wake up at seven.'],
      ['学校に行きます。', 'Tôi đi đến trường.', 'I go to school.'],
    ],
  },
  {
    code: 'n5-de',
    pattern: '～で',
    meaningVi: 'chỉ nơi diễn ra hành động / phương tiện',
    meaningEn: 'location of action / means',
    explanationVi: 'Chỉ địa điểm thực hiện hành động hoặc phương tiện/cách thức.',
    formation: 'Danh từ + で + động từ',
    tags: ['particle', 'location', 'means'],
    examples: [
      ['図書館で勉強します。', 'Tôi học ở thư viện.', 'I study at the library.'],
      ['バスで行きます。', 'Tôi đi bằng xe buýt.', 'I go by bus.'],
    ],
  },
  {
    code: 'n5-kara-made',
    pattern: '～から～まで',
    meaningVi: 'từ ... đến ...',
    meaningEn: 'from ... to ...',
    explanationVi: 'Chỉ điểm bắt đầu và điểm kết thúc về thời gian hoặc địa điểm.',
    formation: 'A + から + B + まで',
    tags: ['range', 'time'],
    examples: [
      ['九時から五時まで働きます。', 'Tôi làm việc từ 9 giờ đến 5 giờ.', 'I work from nine to five.'],
    ],
  },
  {
    code: 'n5-tai',
    pattern: '～たい',
    meaningVi: 'muốn làm ...',
    meaningEn: 'want to do ...',
    explanationVi: 'Biểu thị mong muốn thực hiện một hành động của người nói.',
    formation: 'Động từ bỏ ます + たい',
    tags: ['desire'],
    examples: [
      ['日本へ行きたいです。', 'Tôi muốn đi Nhật Bản.', 'I want to go to Japan.'],
    ],
  },
  {
    code: 'n5-te-kudasai',
    pattern: '～てください',
    meaningVi: 'hãy / vui lòng làm ...',
    meaningEn: 'please do ...',
    explanationVi: 'Yêu cầu hoặc đề nghị người khác thực hiện một hành động một cách lịch sự.',
    formation: 'Động từ thể て + ください',
    tags: ['request', 'te-form'],
    examples: [
      ['ここに名前を書いてください。', 'Vui lòng viết tên ở đây.', 'Please write your name here.'],
    ],
  },
  {
    code: 'n5-te-mo-ii',
    pattern: '～てもいい',
    meaningVi: 'được phép làm ...',
    meaningEn: 'may / be allowed to do ...',
    explanationVi: 'Biểu thị sự cho phép hoặc dùng để xin phép.',
    formation: 'Động từ thể て + もいい',
    tags: ['permission', 'te-form'],
    examples: [
      ['ここで写真を撮ってもいいです。', 'Có thể chụp ảnh ở đây.', 'You may take photos here.'],
    ],
  },
  {
    code: 'n5-te-wa-ikenai',
    pattern: '～てはいけない',
    meaningVi: 'không được làm ...',
    meaningEn: 'must not do ...',
    explanationVi: 'Biểu thị sự cấm đoán.',
    formation: 'Động từ thể て + はいけない',
    tags: ['prohibition', 'te-form'],
    examples: [
      ['ここでタバコを吸ってはいけません。', 'Không được hút thuốc ở đây.', 'You must not smoke here.'],
    ],
  },
] as const;

const kanji = [
  ['日', ['ngày', 'mặt trời'], ['day', 'sun'], ['ニチ', 'ジツ'], ['ひ', '-び', '-か'], 4, '日'],
  ['本', ['sách', 'gốc'], ['book', 'origin'], ['ホン'], ['もと'], 5, '木'],
  ['人', ['người'], ['person'], ['ジン', 'ニン'], ['ひと'], 2, '人'],
  ['学', ['học'], ['study', 'learning'], ['ガク'], ['まな.ぶ'], 8, '子'],
  ['生', ['sống', 'sinh'], ['life', 'birth'], ['セイ', 'ショウ'], ['い.きる', 'う.まれる', 'なま'], 5, '生'],
  ['食', ['ăn', 'thức ăn'], ['eat', 'food'], ['ショク'], ['た.べる'], 9, '食'],
  ['飲', ['uống'], ['drink'], ['イン'], ['の.む'], 12, '食'],
  ['行', ['đi', 'thực hiện'], ['go', 'conduct'], ['コウ', 'ギョウ'], ['い.く', 'おこな.う'], 6, '行'],
  ['見', ['nhìn', 'xem'], ['see', 'look'], ['ケン'], ['み.る'], 7, '見'],
  ['話', ['nói', 'câu chuyện'], ['talk', 'story'], ['ワ'], ['はな.す', 'はなし'], 13, '言'],
  ['時', ['thời gian', 'giờ'], ['time', 'hour'], ['ジ'], ['とき'], 10, '日'],
  ['大', ['lớn'], ['big', 'large'], ['ダイ', 'タイ'], ['おお.きい'], 3, '大'],
  ['小', ['nhỏ'], ['small'], ['ショウ'], ['ちい.さい', 'こ'], 3, '小'],
  ['山', ['núi'], ['mountain'], ['サン'], ['やま'], 3, '山'],
  ['川', ['sông'], ['river'], ['セン'], ['かわ'], 3, '川'],
] as const;

async function main() {
  console.log('Seeding Day 15 Grammar + Kanji starter content...');

  for (const item of grammar) {
    const point = await prisma.grammarPoint.upsert({
      where: { code: item.code },
      create: {
        code: item.code,
        pattern: item.pattern,
        meaningVi: item.meaningVi,
        meaningEn: item.meaningEn,
        explanationVi: item.explanationVi,
        formation: item.formation,
        jlptLevel: JlptLevel.N5,
        tags: [...item.tags],
        source: 'MOCHIJAPAN_CURATED_DAY15',
        status: ContentStatus.PUBLISHED,
      },
      update: {
        pattern: item.pattern,
        meaningVi: item.meaningVi,
        meaningEn: item.meaningEn,
        explanationVi: item.explanationVi,
        formation: item.formation,
        jlptLevel: JlptLevel.N5,
        tags: [...item.tags],
        source: 'MOCHIJAPAN_CURATED_DAY15',
        status: ContentStatus.PUBLISHED,
      },
    });

    await prisma.grammarExample.deleteMany({
      where: { grammarPointId: point.id },
    });

    await prisma.grammarExample.createMany({
      data: item.examples.map(([japanese, vietnamese, english], index) => ({
        grammarPointId: point.id,
        japanese,
        vietnamese,
        english,
        sortOrder: index + 1,
      })),
    });
  }

  for (const [character, meaningsVi, meaningsEn, onyomi, kunyomi, strokeCount, radical] of kanji) {
    const item = await prisma.kanji.upsert({
      where: { character },
      create: {
        character,
        meaningsVi: [...meaningsVi],
        meaningsEn: [...meaningsEn],
        onyomi: [...onyomi],
        kunyomi: [...kunyomi],
        jlptLevel: JlptLevel.N5,
        strokeCount,
        radical,
        source: 'MOCHIJAPAN_CURATED_DAY15',
        status: ContentStatus.PUBLISHED,
      },
      update: {
        meaningsVi: [...meaningsVi],
        meaningsEn: [...meaningsEn],
        onyomi: [...onyomi],
        kunyomi: [...kunyomi],
        jlptLevel: JlptLevel.N5,
        strokeCount,
        radical,
        source: 'MOCHIJAPAN_CURATED_DAY15',
        status: ContentStatus.PUBLISHED,
      },
    });

    const words = await prisma.word.findMany({
      where: {
        writtenForm: {
          contains: character,
        },
      },
      select: { id: true },
    });

    if (words.length > 0) {
      await prisma.kanjiWord.createMany({
        data: words.map((word) => ({
          kanjiId: item.id,
          wordId: word.id,
        })),
        skipDuplicates: true,
      });
    }
  }

  const [grammarCount, kanjiCount, linkCount] = await Promise.all([
    prisma.grammarPoint.count({ where: { status: ContentStatus.PUBLISHED } }),
    prisma.kanji.count({ where: { status: ContentStatus.PUBLISHED } }),
    prisma.kanjiWord.count(),
  ]);

  console.table({ grammarCount, kanjiCount, kanjiWordLinks: linkCount });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
