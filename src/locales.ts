// Built-in locale packs: name seeds, cities, phone formats, language and time zone.
// Names for JP/KR/HK/TW are romanized so emails can be derived from them.

export interface City {
  name: string;
  weight: number;
  /** IANA time zone; falls back to the locale default. */
  tz?: string;
}

export interface LocalePack {
  code: string;
  label: string;
  /** ISO 3166-1 alpha-2 */
  country: string;
  /** ISO 639-1 */
  language: string;
  /** ISO 4217 */
  currency: string;
  timeZone: string;
  /** Country calling code without "+". */
  dialCode: string;
  /** Mobile number prefixes (national, without trunk 0). */
  mobilePrefixes: string[];
  /** Digits after the prefix. */
  subscriberDigits: number;
  /** Display order hint only; Braze still gets first_name / last_name. */
  familyNameFirst: boolean;
  cities: City[];
  names: { male: string[]; female: string[]; last: string[] };
}

export const LOCALES: LocalePack[] = [
  {
    code: "VN", label: "Vietnam", country: "VN", language: "vi", currency: "VND", timeZone: "Asia/Ho_Chi_Minh",
    dialCode: "84", mobilePrefixes: ["90", "91", "93", "94", "96", "97", "98", "86", "88", "89", "32", "33", "34", "35", "36", "37", "38", "39", "70", "76", "77", "78", "79", "81", "82", "83", "84", "85"],
    subscriberDigits: 7, familyNameFirst: true,
    cities: [
      { name: "Ho Chi Minh City", weight: 35 }, { name: "Hanoi", weight: 30 }, { name: "Da Nang", weight: 10 },
      { name: "Hai Phong", weight: 8 }, { name: "Can Tho", weight: 7 }, { name: "Nha Trang", weight: 5 }, { name: "Hue", weight: 5 },
    ],
    names: {
      male: ["Minh", "Huy", "Khang", "Bảo", "Phúc", "Anh", "Duy", "Nam", "Tuấn", "Long", "Hoàng", "Quang", "Đức", "Thành", "Trung", "Hải", "Sơn", "Vinh", "Khoa", "Đạt", "Tài", "Hiếu"],
      female: ["Linh", "Hoa", "Lan", "Mai", "Ngọc", "Trang", "Thảo", "Hương", "Vy", "Nhung", "Hà", "Thu", "Yến", "Phương", "Quỳnh", "Chi", "My", "Hạnh", "Uyên", "Diệp", "Tâm", "Nhi"],
      last: ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"],
    },
  },
  {
    code: "SG", label: "Singapore", country: "SG", language: "en", currency: "SGD", timeZone: "Asia/Singapore",
    dialCode: "65", mobilePrefixes: ["8", "9"], subscriberDigits: 7, familyNameFirst: false,
    cities: [{ name: "Singapore", weight: 1 }],
    names: {
      male: ["Wei Jie", "Jun Hao", "Ethan", "Ryan", "Marcus", "Darren", "Kumar", "Arjun", "Hafiz", "Irfan", "Jonathan", "Zhi Hao", "Benjamin", "Daniel", "Aaron", "Javier"],
      female: ["Hui Min", "Xin Yi", "Rachel", "Michelle", "Priya", "Nur Aisyah", "Siti", "Chloe", "Jia Hui", "Shermaine", "Divya", "Natalie", "Sarah", "Amanda", "Kaili", "Felicia"],
      last: ["Tan", "Lim", "Lee", "Ng", "Ong", "Wong", "Goh", "Chua", "Chan", "Koh", "Teo", "Ang", "Yeo", "Tay", "Ho", "Nair", "Pillai", "Rahman", "Ismail"],
    },
  },
  {
    code: "MY", label: "Malaysia", country: "MY", language: "ms", currency: "MYR", timeZone: "Asia/Kuala_Lumpur",
    dialCode: "60", mobilePrefixes: ["11", "12", "13", "14", "16", "17", "18", "19"], subscriberDigits: 7, familyNameFirst: false,
    cities: [
      { name: "Kuala Lumpur", weight: 30 }, { name: "Petaling Jaya", weight: 15 }, { name: "Johor Bahru", weight: 15 },
      { name: "George Town", weight: 12 }, { name: "Shah Alam", weight: 10 }, { name: "Kuching", weight: 10 }, { name: "Kota Kinabalu", weight: 8 },
    ],
    names: {
      male: ["Muhammad", "Ahmad", "Amir", "Hafiz", "Faiz", "Syafiq", "Aiman", "Wei Ming", "Chee Keong", "Kumar", "Ravi", "Daniel", "Arif", "Haziq", "Zulkifli", "Jun Wei"],
      female: ["Nur", "Siti", "Aisyah", "Farah", "Nurul", "Amira", "Mei Ling", "Hui Ying", "Priya", "Kavitha", "Sarah", "Alya", "Hani", "Zara", "Li Wen", "Syazwani"],
      last: ["Abdullah", "Ibrahim", "Ismail", "Hassan", "Rahman", "Yusof", "Othman", "Tan", "Lim", "Lee", "Wong", "Ng", "Chong", "Raj", "Muthu", "Kaur"],
    },
  },
  {
    code: "ID", label: "Indonesia", country: "ID", language: "id", currency: "IDR", timeZone: "Asia/Jakarta",
    dialCode: "62", mobilePrefixes: ["811", "812", "813", "821", "822", "852", "853", "857", "858", "877", "878", "895", "896", "897"],
    subscriberDigits: 8, familyNameFirst: false,
    cities: [
      { name: "Jakarta", weight: 35 }, { name: "Surabaya", weight: 15 }, { name: "Bandung", weight: 15 }, { name: "Medan", weight: 10 },
      { name: "Semarang", weight: 8 }, { name: "Makassar", weight: 7, tz: "Asia/Makassar" }, { name: "Denpasar", weight: 5, tz: "Asia/Makassar" },
      { name: "Yogyakarta", weight: 5 },
    ],
    names: {
      male: ["Budi", "Agus", "Andi", "Rizky", "Dimas", "Fajar", "Bayu", "Arief", "Eko", "Hendra", "Yoga", "Reza", "Aditya", "Galih", "Teguh", "Ilham"],
      female: ["Siti", "Dewi", "Putri", "Ayu", "Rina", "Sri", "Indah", "Fitri", "Nadia", "Wulan", "Lestari", "Anisa", "Mega", "Ratna", "Intan", "Citra"],
      last: ["Santoso", "Wijaya", "Saputra", "Pratama", "Hidayat", "Setiawan", "Kurniawan", "Nugroho", "Susanto", "Gunawan", "Halim", "Siregar", "Lubis", "Hasibuan", "Purnomo", "Sari"],
    },
  },
  {
    code: "TH", label: "Thailand", country: "TH", language: "th", currency: "THB", timeZone: "Asia/Bangkok",
    dialCode: "66", mobilePrefixes: ["61", "62", "63", "64", "65", "81", "82", "84", "86", "89", "91", "92", "93", "94", "95", "96"],
    subscriberDigits: 7, familyNameFirst: false,
    cities: [
      { name: "Bangkok", weight: 50 }, { name: "Chiang Mai", weight: 12 }, { name: "Phuket", weight: 8 }, { name: "Pattaya", weight: 8 },
      { name: "Nakhon Ratchasima", weight: 8 }, { name: "Khon Kaen", weight: 7 }, { name: "Hat Yai", weight: 7 },
    ],
    names: {
      male: ["Somchai", "Anan", "Krit", "Natthapong", "Thanakorn", "Chaiwat", "Prasert", "Kittisak", "Wichai", "Supachai", "Arthit", "Pongsakorn", "Nattawut", "Teerapat"],
      female: ["Siriporn", "Ploy", "Nattaya", "Kanya", "Pimchanok", "Sukanya", "Waraporn", "Chompoo", "Malee", "Porntip", "Arunee", "Jintana", "Kanokwan", "Rattana"],
      last: ["Saetang", "Srisuk", "Chaiyaporn", "Wongsawat", "Rattanakorn", "Sukjai", "Thongdee", "Boonmee", "Kaewmanee", "Phromma", "Srisawat", "Intharasuk", "Somboon", "Kongkaew"],
    },
  },
  {
    code: "PH", label: "Philippines", country: "PH", language: "en", currency: "PHP", timeZone: "Asia/Manila",
    dialCode: "63", mobilePrefixes: ["905", "906", "915", "916", "917", "918", "919", "920", "921", "926", "927", "928", "929", "935", "939", "945", "947", "955", "956", "965", "966", "975", "977", "995", "997", "998", "999"],
    subscriberDigits: 7, familyNameFirst: false,
    cities: [
      { name: "Quezon City", weight: 25 }, { name: "Manila", weight: 25 }, { name: "Cebu City", weight: 15 },
      { name: "Makati", weight: 13 }, { name: "Davao City", weight: 12 }, { name: "Pasig", weight: 10 },
    ],
    names: {
      male: ["Juan", "Jose", "Mark", "John Paul", "Christian", "Angelo", "Carlo", "Miguel", "Rafael", "Joshua", "Paolo", "Jericho", "Kenneth", "Adrian", "Gabriel", "Ramon"],
      female: ["Maria", "Ana", "Kristine", "Angelica", "Jasmine", "Patricia", "Camille", "Nicole", "Bea", "Andrea", "Princess", "Joy", "Katrina", "Grace", "Danica", "Mae"],
      last: ["Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Garcia", "Mendoza", "Torres", "Tomas", "Andrada", "Castillo", "Flores", "Villanueva", "Ramos", "Aquino", "dela Cruz"],
    },
  },
  {
    code: "US", label: "United States", country: "US", language: "en", currency: "USD", timeZone: "America/New_York",
    dialCode: "1", mobilePrefixes: ["212", "646", "718", "213", "310", "312", "773", "713", "602", "215", "415", "206", "512", "305", "404", "617"],
    subscriberDigits: 7, familyNameFirst: false,
    cities: [
      { name: "New York", weight: 20 }, { name: "Los Angeles", weight: 15, tz: "America/Los_Angeles" }, { name: "Chicago", weight: 12, tz: "America/Chicago" },
      { name: "Houston", weight: 10, tz: "America/Chicago" }, { name: "Phoenix", weight: 8, tz: "America/Phoenix" }, { name: "Philadelphia", weight: 8 },
      { name: "San Francisco", weight: 9, tz: "America/Los_Angeles" }, { name: "Seattle", weight: 9, tz: "America/Los_Angeles" },
      { name: "Austin", weight: 9, tz: "America/Chicago" }, { name: "Miami", weight: 8 }, { name: "Atlanta", weight: 7 }, { name: "Boston", weight: 7 },
    ],
    names: {
      male: ["James", "Michael", "Robert", "David", "William", "John", "Daniel", "Matthew", "Ethan", "Noah", "Liam", "Lucas", "Mason", "Logan", "Carlos", "Jayden", "Tyler", "Brandon"],
      female: ["Emma", "Olivia", "Sophia", "Ava", "Isabella", "Mia", "Emily", "Madison", "Abigail", "Harper", "Chloe", "Ella", "Grace", "Lily", "Hannah", "Sofia", "Aaliyah", "Megan"],
      last: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Lee", "Nguyen"],
    },
  },
  {
    code: "GB", label: "United Kingdom", country: "GB", language: "en", currency: "GBP", timeZone: "Europe/London",
    dialCode: "44", mobilePrefixes: ["74", "75", "77", "78", "79"], subscriberDigits: 8, familyNameFirst: false,
    cities: [
      { name: "London", weight: 40 }, { name: "Manchester", weight: 12 }, { name: "Birmingham", weight: 12 }, { name: "Bristol", weight: 10 },
      { name: "Leeds", weight: 9 }, { name: "Glasgow", weight: 9 }, { name: "Edinburgh", weight: 8 },
    ],
    names: {
      male: ["Oliver", "George", "Harry", "Jack", "Charlie", "Thomas", "Oscar", "James", "William", "Alfie", "Henry", "Freddie", "Arthur", "Archie", "Leo", "Joshua"],
      female: ["Olivia", "Amelia", "Isla", "Ava", "Emily", "Sophie", "Grace", "Lily", "Freya", "Poppy", "Evie", "Ella", "Charlotte", "Jessica", "Florence", "Ruby"],
      last: ["Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson", "Johnson", "Davies", "Robinson", "Wright", "Thompson", "Evans", "Walker", "White", "Roberts", "Green", "Hall", "Patel"],
    },
  },
  {
    code: "AU", label: "Australia", country: "AU", language: "en", currency: "AUD", timeZone: "Australia/Sydney",
    dialCode: "61", mobilePrefixes: ["4"], subscriberDigits: 8, familyNameFirst: false,
    cities: [
      { name: "Sydney", weight: 35 }, { name: "Melbourne", weight: 33, tz: "Australia/Melbourne" }, { name: "Brisbane", weight: 15, tz: "Australia/Brisbane" },
      { name: "Perth", weight: 10, tz: "Australia/Perth" }, { name: "Adelaide", weight: 7, tz: "Australia/Adelaide" },
    ],
    names: {
      male: ["Jack", "Oliver", "William", "Noah", "Thomas", "Lachlan", "Cooper", "Riley", "Liam", "Ethan", "Harrison", "Lucas", "Mitchell", "Hamish", "Angus", "Joshua"],
      female: ["Charlotte", "Olivia", "Mia", "Chloe", "Isla", "Ava", "Matilda", "Sienna", "Zoe", "Ruby", "Georgia", "Emily", "Grace", "Harper", "Jessica", "Lily"],
      last: ["Smith", "Jones", "Williams", "Brown", "Wilson", "Taylor", "Johnson", "White", "Martin", "Anderson", "Thompson", "Nguyen", "Thomas", "Walker", "Harris", "Ryan", "Kelly"],
    },
  },
  {
    code: "JP", label: "Japan", country: "JP", language: "ja", currency: "JPY", timeZone: "Asia/Tokyo",
    dialCode: "81", mobilePrefixes: ["70", "80", "90"], subscriberDigits: 8, familyNameFirst: true,
    cities: [
      { name: "Tokyo", weight: 40 }, { name: "Osaka", weight: 20 }, { name: "Yokohama", weight: 12 }, { name: "Nagoya", weight: 10 },
      { name: "Fukuoka", weight: 10 }, { name: "Sapporo", weight: 8 },
    ],
    names: {
      male: ["Haruto", "Sota", "Yuto", "Ren", "Hiroshi", "Takumi", "Kenta", "Daiki", "Riku", "Shota", "Yuki", "Kaito", "Takeshi", "Kazuki", "Sho", "Ryota"],
      female: ["Yui", "Hina", "Sakura", "Aoi", "Mei", "Yuna", "Rin", "Haruka", "Misaki", "Ayaka", "Nanami", "Emi", "Yuka", "Akari", "Mio", "Kana"],
      last: ["Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Kato", "Yoshida", "Yamada", "Sasaki", "Matsumoto", "Inoue", "Kimura"],
    },
  },
  {
    code: "KR", label: "South Korea", country: "KR", language: "ko", currency: "KRW", timeZone: "Asia/Seoul",
    dialCode: "82", mobilePrefixes: ["10"], subscriberDigits: 8, familyNameFirst: true,
    cities: [
      { name: "Seoul", weight: 50 }, { name: "Busan", weight: 18 }, { name: "Incheon", weight: 12 }, { name: "Daegu", weight: 10 }, { name: "Daejeon", weight: 10 },
    ],
    names: {
      male: ["Minjun", "Seojun", "Doyun", "Jiho", "Hyunwoo", "Junseo", "Jihoon", "Sungmin", "Donghyun", "Taeyang", "Jaewon", "Woojin", "Seungho", "Minho"],
      female: ["Seoyeon", "Jiwoo", "Seoyun", "Minseo", "Hayoon", "Jiyoon", "Sujin", "Yuna", "Eunji", "Soyeon", "Hyejin", "Dahye", "Jiyeon", "Chaeyoung"],
      last: ["Kim", "Lee", "Park", "Choi", "Jung", "Kang", "Cho", "Yoon", "Jang", "Lim", "Han", "Oh", "Seo", "Shin", "Kwon", "Hwang"],
    },
  },
  {
    code: "HK", label: "Hong Kong", country: "HK", language: "zh", currency: "HKD", timeZone: "Asia/Hong_Kong",
    dialCode: "852", mobilePrefixes: ["5", "6", "9"], subscriberDigits: 7, familyNameFirst: true,
    cities: [{ name: "Hong Kong", weight: 1 }],
    names: {
      male: ["Ka Ho", "Chun Kit", "Wing Hong", "Ho Yin", "Tsz Hin", "Man Kit", "Kevin", "Jason", "Alex", "Raymond", "Edmond", "Kelvin", "Dickson", "Wai Lun"],
      female: ["Wing Yan", "Ka Yan", "Hoi Ching", "Tsz Ching", "Mei Ling", "Suet Ying", "Karen", "Vivian", "Michelle", "Cherry", "Winnie", "Joyce", "Fiona", "Sze Wan"],
      last: ["Chan", "Wong", "Lee", "Cheung", "Lau", "Ho", "Ng", "Leung", "Lam", "Tsang", "Chow", "Yip", "Fung", "Mak", "Kwok", "Tang"],
    },
  },
  {
    code: "TW", label: "Taiwan", country: "TW", language: "zh", currency: "TWD", timeZone: "Asia/Taipei",
    dialCode: "886", mobilePrefixes: ["9"], subscriberDigits: 8, familyNameFirst: true,
    cities: [
      { name: "Taipei", weight: 35 }, { name: "New Taipei", weight: 25 }, { name: "Taichung", weight: 15 }, { name: "Kaohsiung", weight: 15 }, { name: "Tainan", weight: 10 },
    ],
    names: {
      male: ["Chia-Hao", "Chih-Wei", "Yu-Cheng", "Chun-Hung", "Po-Han", "Yi-Hsuan", "Kuan-Yu", "Tsung-Han", "Wei-Ting", "Ming-Che", "Jia-Hong", "Bo-Yu"],
      female: ["Shu-Fen", "Yi-Ting", "Hsin-Yi", "Ya-Ting", "Pei-Shan", "Mei-Hua", "Chia-Ying", "Yu-Chen", "Hui-Ju", "Wan-Ting", "Ting-Yu", "Pin-Yu"],
      last: ["Chen", "Lin", "Huang", "Chang", "Lee", "Wang", "Wu", "Liu", "Tsai", "Yang", "Hsu", "Cheng", "Hsieh", "Kuo", "Hung", "Tseng"],
    },
  },
];

export const LOCALE_MAP: Record<string, LocalePack> = Object.fromEntries(LOCALES.map((l) => [l.code, l]));
