
import { baseUrl } from './global';

export interface LangString {
  th: string;
  en: string;
}

export interface Evidence {
  id: string;
  name: LangString;
  description: LangString;
  image: string;
}

export interface DialogueNode {
  text: LangString;
  options?: {
    text: LangString;
    action?: { type: string; payload?: any };
    next: string;
  }[];
}

export interface Clue {
  id: string;
  text: LangString;
  position: { x: number; z: number };
  evidenceId?: string;
  type: 'static' | 'whisper' | 'symbol';
}

export interface LoreObject {
  id: string;
  text: LangString;
  position: { x: number; z: number };
}

export interface CaseData {
  id:string;
  title: LangString;
  description: LangString;
  npcs: {
    [key: string]: {
      role: LangString;
      dialogueTree: { [key: string]: DialogueNode };
    };
  };
  suspects: {
    [key: string]: {
        motive: LangString;
        alibi: LangString;
    }
  };
  evidence: Evidence[];
  clues: Clue[];
  loreObjects: LoreObject[];
  murdererEvidenceMap: { [key: string]: string[] };
  genericReactions: {
    murderer: LangString[];
    innocent: LangString[];
  };
}

const placeholderDialogue = (evidenceIds: string[]): { [key: string]: DialogueNode } => {
    const starts: LangString[] = [
        { th: "มีอะไรให้ฉันช่วยไหม?", en: "Is there anything I can help with?" },
        { th: "เรื่องที่เกิดขึ้นมันน่ากลัวจริงๆ... คุณมีอะไรจะถามฉันรึเปล่า?", en: "What happened is truly terrible... Do you have anything to ask me?" },
        { th: "ฉันยังช็อคไม่หายเลย คุณอยากรู้อะไรเหรอ?", en: "I'm still in shock. What do you want to know?" },
        { th: "คุณนักสืบ... ฉันหวังว่าคุณจะจับคนร้ายได้เร็วๆ นี้นะ", en: "Detective... I hope you catch the culprit soon." }
    ];

    const unusuals: LangString[] = [
        { th: "ไม่นะ ทุกอย่างก็ดูปกติเหมือนทุกวันสำหรับฉัน", en: "No, everything seemed normal like any other day to me." },
        { th: "ฉันนึกไม่ออกจริงๆ ... ไม่เห็นจะมีอะไรแปลกไปเลย", en: "I really can't think of anything... Nothing seemed strange at all." },
        { th: "ก็... เมื่อคืนฉันได้ยินเสียงหมาหอนแปลกๆ  แต่ก็อาจจะไม่มีอะไร", en: "Well... I heard some strange dog howling last night, but it might be nothing." }
    ];

    const stranges: LangString[] = [
        { th: "ก็มีแค่เรื่องเล่าเก่าๆ ที่คนแก่เขาพูดกันน่ะ ไม่น่าจะมีอะไร", en: "Just old stories the elders talk about. Probably nothing." },
        { th: "บางคนก็พูดถึงเรื่องผีสางนางไม้ในป่าแถวนี้ แต่ฉันไม่ค่อยเชื่อเท่าไหร่", en: "Some people talk about spirits in these woods, but I don't really believe in that stuff." },
        { th: "ที่นี่ก็เป็นหมู่บ้านเงียบๆ นะ ไม่ค่อยมีเรื่องแปลกๆ เกิดขึ้นหรอก", en: "This is a quiet village. Strange things don't happen here often." }
    ];
    
    const accuseds: LangString[] = [
        { th: "อะไรนะ! คุณกล่าวหาฉันเหรอ! ฉันเป็นผู้บริสุทธิ์นะ!", en: "What! You accuse me! I am innocent!" },
        { th: "คุณต้องเข้าใจผิดแน่ๆ! ไม่ใช่ฉัน!", en: "You must be mistaken! It wasn't me!" },
        { th: "นี่มันเรื่องบ้าอะไรกัน... ฉันไม่ได้ทำ!", en: "This is crazy... I didn't do it!" }
    ];

    const innocentReactions: LangString[] = [
      { th: "นี่มัน... ฉันไม่เคยเห็นของชิ้นนี้มาก่อนเลย", en: "This... I've never seen this before in my life." },
      { th: "ของสิ่งนี้มันเกี่ยวอะไรกับเรื่องนี้เหรอ?", en: "What does this have to do with anything?" },
      { th: "ฉันไม่รู้ว่านี่คืออะไร บอกตามตรง", en: "I honestly don't know what this is." },
      { th: "ดูไม่คุ้นเลยนะ... คุณเจอมันที่ไหนเหรอ?", en: "It doesn't look familiar... Where did you find it?" }
    ];

    const tree: { [key: string]: DialogueNode } = {
        start: {
            text: starts[Math.floor(Math.random() * starts.length)],
            options: [
                { text: { th: "คุณเห็นอะไรผิดปกติไหม?", en: "Did you see anything unusual?" }, next: 'ask_unusual' },
                { text: { th: "แถวนี้มีเรื่องแปลกๆ เกิดขึ้นบ่อยหรือเปล่า?", en: "Do strange things happen here often?" }, next: 'ask_strange' },
                { text: { th: "แสดงหลักฐาน", en: "Present Evidence" }, action: { type: 'present_evidence' }, next: 'start' },
                { text: { th: "กล่าวหา", en: "Accuse" }, action: { type: 'accuse' }, next: 'accused' },
            ],
        },
        ask_unusual: { text: unusuals[Math.floor(Math.random() * unusuals.length)] },
        ask_strange: { text: stranges[Math.floor(Math.random() * stranges.length)] },
        accused: { text: accuseds[Math.floor(Math.random() * accuseds.length)] },
    };

    evidenceIds.forEach(id => {
        tree[`react_${id}`] = { text: innocentReactions[Math.floor(Math.random() * innocentReactions.length)] };
    });

    return tree;
};

const placeholderSuspects = (motive: LangString, alibi: LangString) => ({
    motive,
    alibi
});

const case0: CaseData = {
  id: "case0",
  title: { th: "เงาในพงไพร", en: "Shadow in the Thicket" },
  description: { 
    th: "ศพถูกพบบริเวณชายป่า สภาพเหมือนถูกสัตว์ป่าทำร้าย แต่ร่องรอยบางอย่างบ่งชี้ว่านี่ไม่ใช่อุบัติเหตุธรรมดา ชาวบ้านต่างหวาดกลัวและลือกันถึงสิ่งลี้ลับที่ซ่อนอยู่ในความมืด",
    en: "A body was found at the edge of the forest, seemingly mauled by a wild animal. But certain tracks suggest this was no mere accident. Villagers are terrified, whispering of a sinister presence lurking in the dark."
  },
  npcs: {
    npc1: { 
      role: { th: "พยาน #1", en: "Witness #1" }, 
      dialogueTree: {
        start: {
          text: { th: "มีอะไรให้ฉันช่วยไหม คุณนักสืบ?", en: "How can I help you, detective?" },
          options: [
            { text: { th: "คุณเห็นอะไรผิดปกติไหม?", en: "Did you see anything unusual?" }, next: 'ask_unusual' },
            { text: { th: "แสดงหลักฐาน", en: "Present Evidence" }, action: { type: 'present_evidence' }, next: 'start' },
            { text: { th: "กล่าวหา", en: "Accuse" }, action: { type: 'accuse' }, next: 'accused' },
          ],
        },
        ask_unusual: { text: { th: "ฉันไม่เห็นอะไรเลย... ก็แค่คืนที่เงียบสงัดเหมือนเคย", en: "I saw nothing... just another quiet night." } },
        accused: { text: { th: "คุณกล่าวหาฉันเหรอ! ฉันบริสุทธิ์นะ!", en: "You accuse me! I am innocent!" } },
        react_c0_red_cloth: { text: { th: "เศษผ้านี่เหรอ? ดูคุ้นๆ นะ แต่ฉันนึกไม่ออกจริงๆ ว่าเคยเห็นที่ไหน", en: "This cloth scrap? It looks familiar, but I can't quite place it." } },
        react_c0_letter: { text: { th: "จดหมายเหรอ? ฉันไม่รู้เรื่องจดหมายอะไรทั้งนั้น", en: "A letter? I don't know anything about a letter." } },
        react_c0_footprint_cast: { text: { th: "รอยเท้าใหญ่ขนาดนี้! น่ากลัวจริงๆ ต้องเป็นสัตว์ร้ายแน่ๆ", en: "Such a large footprint! It must be a beast, how terrifying." } },
      } 
    },
    npc2: { 
      role: { th: "พยาน #2", en: "Witness #2" }, 
      dialogueTree: {
        start: {
          text: { th: "น่ากลัวจริงๆ... หวังว่าคุณจะจับคนร้ายได้เร็วๆ", en: "It's so scary... I hope you catch the culprit soon." },
          options: [
            { text: { th: "แถวนี้มีเรื่องแปลกๆ เกิดขึ้นบ่อยหรือเปล่า?", en: "Do strange things happen here often?" }, next: 'ask_strange' },
            { text: { th: "แสดงหลักฐาน", en: "Present Evidence" }, action: { type: 'present_evidence' }, next: 'start' },
            { text: { th: "กล่าวหา", en: "Accuse" }, action: { type: 'accuse' }, next: 'accused' },
          ],
        },
        ask_strange: { text: { th: "ชาวบ้านลือกันว่ามีคนทำคุณไสยในป่าแถบนี้... ฉันไม่คิดว่ามันจะเป็นเรื่องจริงจนกระทั่งตอนนี้", en: "The villagers whisper of dark magic in these woods... I didn't believe it until now." } },
        accused: { text: { th: "ฉันเนี่ยนะ? คุณต้องล้อเล่นแน่ๆ!", en: "Me? You must be joking!" } },
        react_c0_red_cloth: { text: { th: "ผ้าสีแดง... ดูเหมือนจะเป็นของผู้หญิงนะ ฉันไม่รู้ว่าเป็นของใคร", en: "Red cloth... It looks like it belongs to a woman. I don't know whose it is." } },
        react_c0_letter: { text: { th: "ฉันเห็นผู้ตายถือจดหมายคล้ายๆ แบบนี้เมื่อวันก่อน... เขาดูวิตกกังวลมาก", en: "I saw the deceased holding a similar letter the other day... they looked very worried." } },
        react_c0_footprint_cast: { text: { th: "รอยเท้านี่มัน... ไม่เหมือนรอยเท้าคนเลย", en: "This footprint... it doesn't look human." } },
      } 
    },
    npc3: { role: { th: "พยาน #3", en: "Witness #3" }, dialogueTree: placeholderDialogue(['c0_red_cloth', 'c0_letter', 'c0_footprint_cast']) },
    npc4: { role: { th: "ชาวบ้าน #1", en: "Villager #1" }, dialogueTree: placeholderDialogue(['c0_red_cloth', 'c0_letter', 'c0_footprint_cast']) },
    npc5: { role: { th: "ชาวบ้าน #2", en: "Villager #2" }, dialogueTree: placeholderDialogue(['c0_red_cloth', 'c0_letter', 'c0_footprint_cast']) },
    npc6: { role: { th: "ชาวบ้าน #3", en: "Villager #3" }, dialogueTree: placeholderDialogue(['c0_red_cloth', 'c0_letter', 'c0_footprint_cast']) },
    npc7: { role: { th: "ชาวบ้าน #4", en: "Villager #4" }, dialogueTree: placeholderDialogue(['c0_red_cloth', 'c0_letter', 'c0_footprint_cast']) },
  },
  suspects: {
    npc1: placeholderSuspects({th: "อาจจะโกรธแค้นเรื่องส่วนตัว", en: "May hold a personal grudge."}, {th: "อ้างว่ากำลังหาของป่า", en: "Claims to have been foraging."}),
    npc2: placeholderSuspects({th: "อาจมีความขัดแย้งเรื่องที่ดิน", en: "May have a land dispute."}, {th: "บอกว่าอยู่แต่ในบ้าน", en: "Says they were at home."}),
    npc3: placeholderSuspects({th: "อาจจะรู้ความลับบางอย่างของผู้ตาย", en: "Might know a secret of the deceased."}, {th: "อ้างว่าแค่เดินผ่านมา", en: "Claims to have been just passing by."}),
    npc4: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
    npc5: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
    npc6: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
    npc7: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
  },
  evidence: [
    { id: 'c0_red_cloth', name: { th: 'เศษผ้าสีแดง', en: 'Red Cloth Scrap' }, description: { th: 'เศษผ้าสีแดงที่ขาดวิ่น ติดอยู่กับกิ่งไม้ใกล้ที่เกิดเหตุ', en: 'A torn scrap of red cloth, snagged on a branch near the crime scene.' }, image: `${baseUrl}clue1.png` },
    { id: 'c0_letter', name: { th: 'จดหมายปริศนา', en: 'Mysterious Letter' }, description: { th: 'จดหมายที่ยังไม่ได้เปิดผนึก มีรอยยับยู่ยี่', en: 'An unopened, crumpled letter.' }, image: `${baseUrl}clue2.png` },
    { id: 'c0_footprint_cast', name: { th: 'รอยเท้าหล่อปูน', en: 'Plaster Footprint Cast' }, description: { th: 'รอยเท้าขนาดใหญ่ผิดปกติที่ถูกหล่อเก็บไว้เป็นหลักฐาน', en: 'A cast of an unusually large footprint, preserved as evidence.' }, image: `${baseUrl}clue17.png` },
  ],
  clues: [
    { id: 'c0_clue1', text: { th: 'มีรอยเท้าขนาดใหญ่ตรงนี้', en: 'There are large footprints here.' }, position: { x: 5, z: 5 }, evidenceId: 'c0_footprint_cast', type: 'static' },
    { id: 'c0_clue2', text: { th: 'คุณพบเศษผ้าสีแดง', en: 'You found a scrap of red cloth.' }, position: { x: -10, z: -10 }, evidenceId: 'c0_red_cloth', type: 'static' },
    { id: 'c0_clue3', text: { th: 'มีจดหมายตกอยู่', en: 'A letter is on the ground.' }, position: { x: 15, z: -5 }, evidenceId: 'c0_letter', type: 'static' },
    { id: 'c0_clue4', text: { th: 'เสียงลมพัดผ่านกิ่งไม้ฟังดูเหมือนเสียงคร่ำครวญ', en: 'The wind through the branches sounds like a mournful cry.'}, position: { x: -30, z: 30 }, type: 'whisper' },
    { id: 'c0_clue5', text: { th: 'สัญลักษณ์แปลกๆ ถูกสลักไว้บนต้นไม้เก่าแก่', en: 'A strange symbol is carved into an old tree.'}, position: { x: 40, z: -40 }, type: 'symbol' },
  ],
  loreObjects: [
    { id: 'l0_shrine', text: { th: 'ศาลเจ้าเล็กๆ ผุพังไปตามกาลเวลา มีคนนำดอกไม้เหี่ยวๆ มาวางไว้', en: 'A small shrine, weathered by time. Someone has left withered flowers.' }, position: { x: 25, z: 25 } },
    { id: 'l0_campsite', text: { th: 'ร่องรอยกองไฟที่มอดไปนานแล้ว ดูเหมือนมีคนเคยมาพักแรมแต่จากไปอย่างรีบร้อน', en: 'The remains of a long-dead campfire. It looks like someone left in a hurry.' }, position: { x: -40, z: 10 } },
    { id: 'l0_rock', text: { th: 'หินก้อนนี้มีรอยขีดข่วนแปลกๆ คล้ายตัวอักษรโบราณ แต่ลบเลือนจนอ่านไม่ออก', en: 'This rock has strange scratches, like ancient letters, but they are too faded to read.' }, position: { x: -5, z: -35 } },
  ],
  murdererEvidenceMap: {
      npc1: ['c0_red_cloth'], npc2: ['c0_letter'], npc3: ['c0_red_cloth', 'c0_footprint_cast'], npc4: ['c0_letter', 'c0_footprint_cast'],
      npc5: ['c0_red_cloth'], npc6: ['c0_letter'], npc7: ['c0_red_cloth', 'c0_letter']
  },
  genericReactions: {
    murderer: [
        { th: "คุณได้สิ่งนี้มาจากไหน?! มันไม่ใช่ของฉัน!", en: "Where did you get this?! It's not mine!" },
        { th: "นี่มัน... เรื่องเข้าใจผิดกันไปใหญ่แล้ว", en: "This... this is a huge misunderstanding." }
    ],
    innocent: [
        { th: "ฉันไม่เคยเห็นสิ่งนี้มาก่อนเลยในชีวิต", en: "I've never seen this before in my life." },
        { th: "สิ่งนี้เกี่ยวข้องกับเรื่องที่เกิดขึ้นได้อย่างไร?", en: "What does this have to do with anything?" },
        { th: "ดูน่าสนใจนะ แต่มันไม่ใช่ของฉัน", en: "That's interesting, but it's not mine." }
    ]
  }
};

//งานถึก Hard and Silly Works
const case1: CaseData = {
  id: "case1",
  title: { th: "วิญญาณพยาบาท", en: "Vengeful Spirit" },
  description: {
    th: "ผู้ตายถูกพบในสภาพที่น่าสยดสยอง ใบหน้าบิดเบี้ยวด้วยความหวาดกลัว ไม่มีบาดแผลภายนอก แต่ของใช้ส่วนตัวถูกนำไปประกอบพิธีกรรมบางอย่าง มันคือการฆาตกรรมโดยใช้มนต์ดำหรือไม่?",
    en: "The deceased was found in a horrific state, face twisted in terror. There are no external wounds, but their personal belongings have been used in some sort of ritual. Was this a murder by black magic?"
  },
  npcs: {
    npc1: { role: { th: "พยาน #1", en: "Witness #1" }, dialogueTree: placeholderDialogue(['c1_doll', 'c1_talisman', 'c1_ashes']) },
    npc2: { role: { th: "พยาน #2", en: "Witness #2" }, dialogueTree: placeholderDialogue(['c1_doll', 'c1_talisman', 'c1_ashes']) },
    npc3: { role: { th: "พยาน #3", en: "Witness #3" }, dialogueTree: placeholderDialogue(['c1_doll', 'c1_talisman', 'c1_ashes']) },
    npc4: { role: { th: "ชาวบ้าน #1", en: "Villager #1" }, dialogueTree: placeholderDialogue(['c1_doll', 'c1_talisman', 'c1_ashes']) },
    npc5: { role: { th: "ชาวบ้าน #2", en: "Villager #2" }, dialogueTree: placeholderDialogue(['c1_doll', 'c1_talisman', 'c1_ashes']) },
    npc6: { role: { th: "ชาวบ้าน #3", en: "Villager #3" }, dialogueTree: placeholderDialogue(['c1_doll', 'c1_talisman', 'c1_ashes']) },
    npc7: { role: { th: "ชาวบ้าน #4", en: "Villager #4" }, dialogueTree: placeholderDialogue(['c1_doll', 'c1_talisman', 'c1_ashes']) },
  },
  suspects: {
    npc1: placeholderSuspects({th: "ผู้ตายเคยหักหลังในอดีต", en: "Was betrayed by the deceased in the past."}, {th: "กำลังทำพิธีบูชาบรรพบุรุษ", en: "Was performing a ritual for their ancestors."}),
    npc2: placeholderSuspects({th: "โกรธแค้นที่ผู้ตายทำให้ครอบครัวต้องลำบาก", en: "Blames the deceased for their family's hardship."}, {th: "อยู่กับครอบครัวตลอดเวลา", en: "Was with their family the whole time."}),
    npc3: placeholderSuspects({th: "เชื่อว่าผู้ตายเป็นสาเหตุของเรื่องร้ายๆ", en: "Believed the deceased caused misfortune."}, {th: "กำลังเก็บสมุนไพรในป่าลึก", en: "Was gathering herbs deep in the forest."}),
    npc4: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
    npc5: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
    npc6: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
    npc7: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
  },
  evidence: [
    { id: 'c1_doll', name: { th: 'ตุ๊กตาฟาง', en: 'Straw Doll' }, description: { th: 'ตุ๊กตาฟางมีเส้นฉันของผู้ตายพันอยู่ ถูกแทงด้วยของมีคม', en: 'A straw doll, wrapped with the deceased\'s hair, has been pierced by a sharp object.' }, image: `${baseUrl}clue3.png` },
    { id: 'c1_talisman', name: { th: 'ยันต์อาคม', en: 'Cursed Talisman' }, description: { th: 'ยันต์ที่เขียนด้วยอักขระโบราณ ใช้ในการเรียกวิญญาณร้าย', en: 'A talisman with ancient script, used to summon evil spirits.' }, image: `${baseUrl}clue4.png` },
    { id: 'c1_ashes', name: { th: 'กองขี้เถ้าเย็น', en: 'Cold Ashes' }, description: { th: 'กองขี้เถ้าที่เย็นสนิทจากการทำพิธีบางอย่าง มีกลิ่นสมุนไพรแปลกๆ', en: 'A cold pile of ashes from a recent ritual, smelling of strange herbs.' }, image: `${baseUrl}clue18.png` },
  ],
  clues: [
    { id: 'c1_clue1', text: { th: 'คุณพบตุ๊กตาฟางรูปร่างประหลาด', en: 'You found a strangely shaped straw doll.' }, position: { x: -5, z: 15 }, evidenceId: 'c1_doll', type: 'static' },
    { id: 'c1_clue2', text: { th: 'ใต้ต้นไม้ใหญ่ มียันต์อาคมซ่อนอยู่', en: 'A cursed talisman is hidden under the large tree.' }, position: { x: 20, z: -20 }, evidenceId: 'c1_talisman', type: 'static' },
    { id: 'c1_clue3', text: { th: 'เสียงสวดมนต์แผ่วเบาดังมาจากบริเวณแท่นบูชาหิน', en: 'A faint chanting seems to emanate from the stone altar.' }, position: { x: 0, z: 0 }, type: 'whisper' },
    { id: 'c1_clue4', text: { th: 'สัญลักษณ์ของการกักขังถูกวาดไว้บนพื้นดินที่ซ่อนอยู่หลังพุ่มไม้', en: 'A symbol of containment is drawn on the ground, hidden behind a bush.' }, position: { x: -25, z: -25 }, type: 'symbol' },
    { id: 'c1_clue5', text: { th: 'มีกองขี้เถ้าจากการทำพิธีกรรม', en: 'There is a pile of ashes from a ritual.' }, position: { x: 30, z: 30 }, evidenceId: 'c1_ashes', type: 'static' },
  ],
  loreObjects: [
      { id: 'l1_candles', text: { th: 'เทียนหลายเล่มถูกจุดแล้วปล่อยให้มอดไหม้ไปเองบริเวณนี้', en: 'Several candles were lit here and left to burn out on their own.' }, position: { x: 15, z: 15 } },
      { id: 'l1_offering', text: { th: 'ผลไม้เน่าเสียถูกวางทิ้งไว้บนโขดหิน เหมือนเป็นของเซ่นไหว้ที่ถูกลืม', en: 'Rotten fruit lies on a rock, like a forgotten offering.' }, position: { x: -30, z: 5 } },
  ],
  murdererEvidenceMap: {
      npc1: ['c1_doll'], npc2: ['c1_talisman'], npc3: ['c1_doll', 'c1_ashes'], npc4: ['c1_talisman'],
      npc5: ['c1_ashes'], npc6: ['c1_talisman'], npc7: ['c1_doll', 'c1_talisman']
  },
  genericReactions: {
    murderer: [
        { th: "คุณกำลังกล่าวหาฉันด้วยเรื่องงมงายเช่นนี้เหรอ?", en: "Are you accusing me with such superstitious nonsense?" },
        { th: "ฉัน... ฉันไม่รู้ว่ามันมาอยู่ที่นี่ได้อย่างไร!", en: "I... I don't know how that got here!" }
    ],
    innocent: [
        { th: "นี่มันอะไรกัน? ดูน่าขนลุก", en: "What is this? It looks creepy." },
        { th: "ฉันเคยได้ยินเรื่องของแบบนี้ แต่ไม่เคยเห็นกับตา", en: "I've heard of things like this, but never seen one myself." },
        { th: "หวังว่าคุณจะไม่คิดว่าฉันเกี่ยวข้องกับเรื่องแบบนี้นะ", en: "I hope you don't think I'm involved in this sort of thing." }
    ]
  }
};

const case2: CaseData = {
  id: "case2",
  title: { th: "อาถรรพ์คืนเดือนดับ", en: "Curse of the New Moon" },
  description: {
    th: "ในคืนเดือนดับที่มืดมิดที่สุด การฆาตกรรมได้เกิดขึ้นพร้อมกับสัญลักษณ์ประหลาดที่วาดด้วยเลือด นี่คือการสังเวยให้กับอำนาจมืด หรือเป็นฝีมือของคนในลัทธิประหลาด?",
    en: "On the darkest of new moon nights, a murder coincides with a strange symbol drawn in blood. Is this a sacrifice to a dark power, or the work of a bizarre cult?"
  },
  npcs: {
    npc1: { role: { th: "พยาน #1", en: "Witness #1" }, dialogueTree: placeholderDialogue(['c2_knife', 'c2_symbols', 'c2_robes']) },
    npc2: { role: { th: "พยาน #2", en: "Witness #2" }, dialogueTree: placeholderDialogue(['c2_knife', 'c2_symbols', 'c2_robes']) },
    npc3: { role: { th: "พยาน #3", en: "Witness #3" }, dialogueTree: placeholderDialogue(['c2_knife', 'c2_symbols', 'c2_robes']) },
    npc4: { role: { th: "ชาวบ้าน #1", en: "Villager #1" }, dialogueTree: placeholderDialogue(['c2_knife', 'c2_symbols', 'c2_robes']) },
    npc5: { role: { th: "ชาวบ้าน #2", en: "Villager #2" }, dialogueTree: placeholderDialogue(['c2_knife', 'c2_symbols', 'c2_robes']) },
    npc6: { role: { th: "ชาวบ้าน #3", en: "Villager #3" }, dialogueTree: placeholderDialogue(['c2_knife', 'c2_symbols', 'c2_robes']) },
    npc7: { role: { th: "ชาวบ้าน #4", en: "Villager #4" }, dialogueTree: placeholderDialogue(['c2_knife', 'c2_symbols', 'c2_robes']) },
  },
  suspects: {
      npc1: placeholderSuspects({th: "ต้องการพลังอำนาจจากพิธีกรรม", en: "Seeks power from the ritual."}, {th: "กำลังเตรียมของไหว้เจ้าที่", en: "Was preparing offerings for the local spirit."}),
      npc2: placeholderSuspects({th: "ถูกบังคับให้เข้าร่วมพิธี", en: "Was forced to participate in the ritual."}, {th: "อ้างว่าหลงทางในป่า", en: "Claims to have been lost in the forest."}),
      npc3: placeholderSuspects({th: "เป็นส่วนหนึ่งของลัทธิประหลาด", en: "Is part of a strange cult."}, {th: "บอกว่ากำลังทำสมาธิ", en: "Says they were meditating."}),
      npc4: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
      npc5: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
      npc6: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
      npc7: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
  },
  evidence: [
      { id: 'c2_knife', name: { th: 'มีดอาคม', en: 'Ritual Dagger' }, description: { th: 'มีดสลักลายแปลกตา เปื้อนคราบเลือดที่ยังไม่แห้ง', en: 'An ornately carved dagger, stained with fresh blood.' }, image: `${baseUrl}clue5.png` },
      { id: 'c2_symbols', name: { th: 'สัญลักษณ์บนพื้นดิน', en: 'Symbol on the Ground' }, description: { th: 'วงกลมและสัญลักษณ์ประหลาดที่วาดด้วยเลือดรอบๆ ศพ', en: 'A circle and strange symbols drawn in blood surround the corpse.' }, image: `${baseUrl}clue6.png` },
      { id: 'c2_robes', name: { th: 'เสื้อคลุมเปื้อนโคลน', en: 'Mud-stained Robes' }, description: { th: 'เสื้อคลุมสีดำสำหรับทำพิธี ถูกซ่อนไว้และเปื้อนโคลนจากที่เกิดเหตุ', en: 'Black ceremonial robes, hastily hidden and stained with mud from the crime scene.' }, image: `${baseUrl}clue19.png` },
  ],
  clues: [
      { id: 'c2_clue1', text: { th: 'มีดอาคมเล่มหนึ่งตกอยู่ในพุ่มไม้', en: 'A ritual dagger was dropped in a bush.' }, position: { x: 0, z: -18 }, evidenceId: 'c2_knife', type: 'static' },
      { id: 'c2_clue2', text: { th: 'พื้นดินรอบที่เกิดเหตุมีสัญลักษณ์แปลกๆ', en: 'The ground around the scene has strange symbols.' }, position: { x: 10, z: 10 }, evidenceId: 'c2_symbols', type: 'static' },
      { id: 'c2_clue3', text: { th: 'เสียงกระซิบชื่อที่ไม่คุ้นเคยลอยมาจากความมืด', en: 'An unfamiliar name is being whispered from the darkness.' }, position: { x: -35, z: 0 }, type: 'whisper' },
      { id: 'c2_clue4', text: { th: 'สัญลักษณ์แห่งการอัญเชิญถูกซ่อนไว้บนโขดหิน', en: 'A summoning sigil is hidden on a rock face.' }, position: { x: 35, z: 35 }, type: 'symbol' },
      { id: 'c2_clue5', text: { th: 'มีคนซ่อนเสื้อคลุมทำพิธีไว้หลังบ้านร้าง', en: 'Someone hid ceremonial robes behind an abandoned house.' }, position: { x: -40, z: -40 }, evidenceId: 'c2_robes', type: 'static' },
  ],
  loreObjects: [],
  murdererEvidenceMap: {
      npc1: ['c2_knife'], npc2: ['c2_symbols'], npc3: ['c2_knife', 'c2_symbols'], npc4: ['c2_robes'],
      npc5: ['c2_symbols', 'c2_robes'], npc6: ['c2_knife'], npc7: ['c2_symbols']
  },
  genericReactions: {
    murderer: [
        { th: "คุณกำลังกล่าวหาฉันด้วยเรื่องงมงายเช่นนี้เหรอ?", en: "Are you accusing me with such superstitious nonsense?" },
        { th: "ฉัน... ฉันไม่รู้ว่ามันมาอยู่ที่นี่ได้อย่างไร!", en: "I... I don't know how that got here!" }
    ],
    innocent: [
        { th: "นี่มันอะไรกัน? ดูน่าขนลุก", en: "What is this? It looks creepy." },
        { th: "ฉันเคยได้ยินเรื่องของแบบนี้ แต่ไม่เคยเห็นกับตา", en: "I've heard of things like this, but never seen one myself." },
        { th: "หวังว่าคุณจะไม่คิดว่าฉันเกี่ยวข้องกับเรื่องแบบนี้นะ", en: "I hope you don't think I'm involved in this sort of thing." }
    ]
  }
};

const case3: CaseData = {
  id: "case3",
  title: { th: "เสียงกระซิบจากป่าช้า", en: "Whispers from the Grave" },
  description: {
    th: "การตายที่ดูเหมือนจะเกิดจากความหวาดกลัวสุดขีด แต่ชาวบ้านกลับเชื่อว่าเป็นฝีมือของวิญญาณที่ถูกปลุกขึ้นมาเพื่อปกป้องใครบางคน ใครกันที่ควบคุมวิญญาณตนนั้น?",
    en: "A death seemingly caused by sheer terror. But villagers believe it's the work of a spirit, summoned to protect someone. Who is controlling this spectral guardian?"
  },
  npcs: {
    npc1: { role: { th: "พยาน #1", en: "Witness #1" }, dialogueTree: placeholderDialogue(['c3_amulet', 'c3_diary', 'c3_grave_offering']) },
    npc2: { role: { th: "พยาน #2", en: "Witness #2" }, dialogueTree: placeholderDialogue(['c3_amulet', 'c3_diary', 'c3_grave_offering']) },
    npc3: { role: { th: "พยาน #3", en: "Witness #3" }, dialogueTree: placeholderDialogue(['c3_amulet', 'c3_diary', 'c3_grave_offering']) },
    npc4: { role: { th: "ชาวบ้าน #1", en: "Villager #1" }, dialogueTree: placeholderDialogue(['c3_amulet', 'c3_diary', 'c3_grave_offering']) },
    npc5: { role: { th: "ชาวบ้าน #2", en: "Villager #2" }, dialogueTree: placeholderDialogue(['c3_amulet', 'c3_diary', 'c3_grave_offering']) },
    npc6: { role: { th: "ชาวบ้าน #3", en: "Villager #3" }, dialogueTree: placeholderDialogue(['c3_amulet', 'c3_diary', 'c3_grave_offering']) },
    npc7: { role: { th: "ชาวบ้าน #4", en: "Villager #4" }, dialogueTree: placeholderDialogue(['c3_amulet', 'c3_diary', 'c3_grave_offering']) },
  },
  suspects: {
      npc1: placeholderSuspects({th: "ถูกวิญญาณเข้าสิงเพื่อกำจัดคนที่คิดร้าย", en: "Possessed by a spirit to eliminate a threat."}, {th: "กำลังซ่อมหลังคาบ้าน", en: "Was fixing their roof."}),
      npc2: placeholderSuspects({th: "ทำพิธีเพื่อปกป้องตัวเอง แต่ผิดพลาด", en: "Performed a protection ritual that went wrong."}, {th: "บอกว่านอนป่วยอยู่บ้าน", en: "Says they were sick at home."}),
      npc3: placeholderSuspects({th: "ผู้ตายกำลังจะเปิดโปงความลับบางอย่าง", en: "The deceased was about to expose their secret."}, {th: "อ้างว่าไปเยี่ยมญาติที่หมู่บ้านอื่น", en: "Claims to have visited relatives in another village."}),
      npc4: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
      npc5: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
      npc6: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
      npc7: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
  },
  evidence: [
      { id: 'c3_amulet', name: { th: 'เครื่องรางสีดำ', en: 'Black Amulet' }, description: { th: 'เครื่องรางที่ควรจะปกป้องกลับมีไอชั่วร้ายแผ่ออกมา', en: 'An amulet that should protect, but now radiates a sinister aura.' }, image: `${baseUrl}clue7.png` },
      { id: 'c3_diary', name: { th: 'บันทึกลับ', en: 'Secret Diary' }, description: { th: 'บันทึกที่เขียนว่ารู้สึกเหมือนมีใครบางคนคอยปกป้อง... และกำจัดศัตรูให้', en: 'A diary entry mentions feeling protected by someone... who also eliminates their enemies.' }, image: `${baseUrl}clue8.png` },
      { id: 'c3_grave_offering', name: { th: 'ของเซ่นไหว้ที่หลุมศพ', en: 'Grave Offering' }, description: { th: 'ดอกไม้และของเซ่นไหว้ที่ยังใหม่ ถูกวางไว้ที่หลุมศพที่ถูกลืม', en: 'Fresh flowers and offerings left at a forgotten grave.' }, image: `${baseUrl}clue20.png` },
  ],
  clues: [
      { id: 'c3_clue1', text: { th: 'เครื่องรางสีดำสนิทตกอยู่ข้างทาง', en: 'A pitch-black amulet lies on the roadside.' }, position: { x: -12, z: -12 }, evidenceId: 'c3_amulet', type: 'static' },
      { id: 'c3_clue2', text: { th: 'คุณพบบันทึกลับซ่อนอยู่ในโพรงไม้', en: 'You found a secret diary hidden in a tree hollow.' }, position: { x: 25, z: 0 }, evidenceId: 'c3_diary', type: 'static' },
      { id: 'c3_clue3', text: { th: 'เสียงสะอื้นไห้ของสตรีดังมาจากใต้ต้นไทรใหญ่', en: "A woman's sobbing can be heard from under a large banyan tree." }, position: { x: -40, z: -40 }, type: 'whisper' },
      { id: 'c3_clue4', text: { th: 'สัญลักษณ์แห่งการปกป้องถูกทิ้งไว้ในบ้านร้าง', en: 'A protection ward was left in an abandoned house.' }, position: { x: 40, z: 40 }, type: 'symbol' },
      { id: 'c3_clue5', text: { th: 'มีคนนำของมาเซ่นไหว้หลุมศพที่ถูกลืม', en: 'Someone left fresh offerings at a forgotten grave.' }, position: { x: -50, z: 50 }, evidenceId: 'c3_grave_offering', type: 'static' },
  ],
  loreObjects: [],
  murdererEvidenceMap: {
      npc1: ['c3_amulet', 'c3_grave_offering'], npc2: ['c3_diary'], npc3: ['c3_amulet'], npc4: ['c3_diary'],
      npc5: ['c3_amulet', 'c3_diary'], npc6: ['c3_grave_offering'], npc7: ['c3_diary']
  },
  genericReactions: {
    murderer: [
        { th: "คุณกำลังกล่าวหาฉันด้วยเรื่องงมงายเช่นนี้เหรอ?", en: "Are you accusing me with such superstitious nonsense?" },
        { th: "ฉัน... ฉันไม่รู้ว่ามันมาอยู่ที่นี่ได้อย่างไร!", en: "I... I don't know how that got here!" }
    ],
    innocent: [
        { th: "นี่มันอะไรกัน? ดูน่าขนลุก", en: "What is this? It looks creepy." },
        { th: "ฉันเคยได้ยินเรื่องของแบบนี้ แต่ไม่เคยเห็นกับตา", en: "I've heard of things like this, but never seen one myself." },
        { th: "หวังว่าคุณจะไม่คิดว่าฉันเกี่ยวข้องกับเรื่องแบบนี้นะ", en: "I hope you don't think I'm involved in this sort of thing." }
    ]
  }
};

const case4: CaseData = {
    id: "case4",
    title: { th: "เปรตอาฆาต", en: "The Famished Ghost" },
    description: {
      th: "ศพมีสภาพผอมแห้งราวกับถูกสูบพลังชีวิตออกไปจนหมดสิ้น บริเวณใกล้เคียงมีของเซ่นไหว้แปลกๆ วางอยู่ เป็นไปได้หรือไม่ว่ามีคนพยายามเลี้ยงผี แต่กลับถูกมันทำร้ายเสียเอง?",
      en: "The corpse is emaciated, as if its life force was drained completely. Strange offerings are placed nearby. Is it possible someone tried to control a ghost, only to become its victim?"
    },
    npcs: {
      npc1: { role: { th: "พยาน #1", en: "Witness #1" }, dialogueTree: placeholderDialogue(['c4_offerings', 'c4_torn_spell']) },
      npc2: { role: { th: "พยาน #2", en: "Witness #2" }, dialogueTree: placeholderDialogue(['c4_offerings', 'c4_torn_spell']) },
      npc3: { role: { th: "พยาน #3", en: "Witness #3" }, dialogueTree: placeholderDialogue(['c4_offerings', 'c4_torn_spell']) },
      npc4: { role: { th: "ชาวบ้าน #1", en: "Villager #1" }, dialogueTree: placeholderDialogue(['c4_offerings', 'c4_torn_spell']) },
      npc5: { role: { th: "ชาวบ้าน #2", en: "Villager #2" }, dialogueTree: placeholderDialogue(['c4_offerings', 'c4_torn_spell']) },
      npc6: { role: { th: "ชาวบ้าน #3", en: "Villager #3" }, dialogueTree: placeholderDialogue(['c4_offerings', 'c4_torn_spell']) },
      npc7: { role: { th: "ชาวบ้าน #4", en: "Villager #4" }, dialogueTree: placeholderDialogue(['c4_offerings', 'c4_torn_spell']) },
    },
    suspects: {
        npc1: placeholderSuspects({th: "พยายามจะเลี้ยงผี แต่ควบคุมไม่ได้", en: "Tried to raise a spirit but lost control."}, {th: "กำลังหาอาหารในป่า", en: "Was looking for food in the forest."}),
        npc2: placeholderSuspects({th: "ทำพิธีสะกดวิญญาณแต่ล้มเหลว", en: "Failed a ritual to bind a spirit."}, {th: "บอกว่ากำลังสร้างรั้วบ้าน", en: "Says they were building a fence."}),
        npc3: placeholderSuspects({th: "เคยถูกผู้ตายขโมยของเซ่นไหว้", en: "The deceased once stole their offerings."}, {th: "อ้างว่ากำลังนอนหลับ", en: "Claims to have been asleep."}),
        npc4: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
        npc5: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
        npc6: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
        npc7: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
    },
    evidence: [
        { id: 'c4_offerings', name: { th: 'ของเซ่นไหว้ประหลาด', en: 'Strange Offerings' }, description: { th: 'ของสดคาวและเศษอาหารที่ถูกจัดวางเหมือนทำพิธีกรรม', en: 'Raw meat and food scraps arranged in a ritualistic manner.' }, image: `${baseUrl}clue9.png` },
        { id: 'c4_torn_spell', name: { th: 'คาถาที่ถูกฉีก', en: 'Torn Spell Page' }, description: { th: 'หน้ากระดาษจากตำราไสยเวทย์ มีรอยฉีกขาด บอกวิธีเรียกและควบคุมวิญญาณ', en: 'A torn page from a spellbook, detailing how to summon and control a spirit.' }, image: `${baseUrl}clue10.png` },
    ],
    clues: [
        { id: 'c4_clue1', text: { th: 'มีของเซ่นไหว้แปลกๆ วางอยู่บนตอไม้', en: 'Strange offerings are placed on a tree stump.' }, position: { x: 30, z: 30 }, evidenceId: 'c4_offerings', type: 'static' },
        { id: 'c4_clue2', text: { th: 'เศษกระดาษจากตำราโบราณปลิวมาติดกิ่งไม้', en: 'A scrap of paper from an old book is caught on a branch.' }, position: { x: -20, z: 5 }, evidenceId: 'c4_torn_spell', type: 'static' },
        { id: 'c4_clue3', text: { th: 'เสียงท้องร้องโหยหวนดังมาจากพงหญ้าทึบ', en: 'A hungry growl echoes from a dense thicket.' }, position: { x: -10, z: -30 }, type: 'whisper' },
        { id: 'c4_clue4', text: { th: 'สัญลักษณ์ที่หมายถึง "ความหิวโหย" ถูกซ่อนอยู่ใต้ก้อนหิน', en: 'A symbol for "hunger" is hidden under a rock.' }, position: { x: 20, z: -15 }, type: 'symbol' },
    ],
    loreObjects: [],
    murdererEvidenceMap: {
        npc1: ['c4_offerings'], npc2: ['c4_torn_spell'], npc3: ['c4_offerings'], npc4: ['c4_torn_spell'],
        npc5: ['c4_offerings'], npc6: ['c4_torn_spell', 'c4_offerings'], npc7: ['c4_offerings']
    },
    genericReactions: {
        murderer: [
            { th: "คุณได้สิ่งนี้มาจากไหน?! มันไม่ใช่ของฉัน!", en: "Where did you get this?! It's not mine!" },
            { th: "นี่มัน... เรื่องเข้าใจผิดกันไปใหญ่แล้ว", en: "This... this is a huge misunderstanding." }
        ],
        innocent: [
            { th: "ฉันไม่เคยเห็นสิ่งนี้มาก่อนเลยในชีวิต", en: "I've never seen this before in my life." },
            { th: "สิ่งนี้เกี่ยวข้องกับเรื่องที่เกิดขึ้นได้อย่างไร?", en: "What does this have to do with anything?" },
            { th: "ดูน่าสนใจนะ แต่มันไม่ใช่ของฉัน", en: "That's interesting, but it's not mine." }
        ]
      }
};

const case5: CaseData = {
    id: "case5",
    title: { th: "พิธีอัญเชิญมรณะ", en: "The Fatal Summoning" },
    description: {
      th: "วงกลมเกลือที่ควรจะใช้ป้องกันสิ่งชั่วร้ายกลับถูกทำลาย และมีตำราไสยเวทย์โบราณตกอยู่ใกล้ๆ ดูเหมือนว่าผู้ตายกำลังทำพิธีบางอย่าง แล้วเกิดความผิดพลาดร้ายแรงขึ้น",
      en: "A salt circle, meant for protection, has been broken. An ancient grimoire lies nearby. It seems the victim was in the middle of a ritual that went horribly wrong."
    },
    npcs: {
      npc1: { role: { th: "พยาน #1", en: "Witness #1" }, dialogueTree: placeholderDialogue(['c5_salt_circle', 'c5_grimoire']) },
      npc2: { role: { th: "พยาน #2", en: "Witness #2" }, dialogueTree: placeholderDialogue(['c5_salt_circle', 'c5_grimoire']) },
      npc3: { role: { th: "พยาน #3", en: "Witness #3" }, dialogueTree: placeholderDialogue(['c5_salt_circle', 'c5_grimoire']) },
      npc4: { role: { th: "ชาวบ้าน #1", en: "Villager #1" }, dialogueTree: placeholderDialogue(['c5_salt_circle', 'c5_grimoire']) },
      npc5: { role: { th: "ชาวบ้าน #2", en: "Villager #2" }, dialogueTree: placeholderDialogue(['c5_salt_circle', 'c5_grimoire']) },
      npc6: { role: { th: "ชาวบ้าน #3", en: "Villager #3" }, dialogueTree: placeholderDialogue(['c5_salt_circle', 'c5_grimoire']) },
      npc7: { role: { th: "ชาวบ้าน #4", en: "Villager #4" }, dialogueTree: placeholderDialogue(['c5_salt_circle', 'c5_grimoire']) },
    },
    suspects: {
        npc1: placeholderSuspects({th: "ทำพิธีอัญเชิญบางอย่างแล้วควบคุมไม่ได้", en: "Summoned something they couldn't control."}, {th: "กำลังสวดมนต์อยู่ในกระท่อม", en: "Was praying in their hut."}),
        npc2: placeholderSuspects({th: "ผู้ตายเป็นคนทำลายวงกลมอาคม", en: "The deceased broke their ritual circle."}, {th: "อ้างว่ากำลังตามหาวัวที่หายไป", en: "Claims they were looking for a lost cow."}),
        npc3: placeholderSuspects({th: "อยากรู้อยากเห็น ลองทำพิธีตามตำรา", en: "Was curious and tried a ritual from a book."}, {th: "บอกว่ากำลังอ่านหนังสือเงียบๆ", en: "Says they were reading quietly."}),
        npc4: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
        npc5: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
        npc6: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
        npc7: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
    },
    evidence: [
        { id: 'c5_salt_circle', name: { th: 'วงกลมเกลือที่ขาด', en: 'Broken Salt Circle' }, description: { th: 'วงกลมที่โรยด้วยเกลือเพื่อป้องกันสิ่งชั่วร้าย มีร่องรอยถูกทำลาย', en: 'A protective circle of salt has been disturbed and broken.' }, image: `${baseUrl}clue11.png` },
        { id: 'c5_grimoire', name: { th: 'ตำราไสยเวทย์', en: 'Grimoire' }, description: { th: 'ตำราเก่าแก่ที่เปิดหน้าวิธีอัญเชิญบางสิ่งบางอย่างทิ้งไว้', en: 'An ancient book left open to a page on summoning rituals.' }, image: `${baseUrl}clue12.png` },
    ],
    clues: [
        { id: 'c5_clue1', text: { th: 'บนพื้นมีวงกลมเกลือ แต่มีส่วนหนึ่งขาดหายไป', en: 'There is a salt circle on the ground, but a section of it is broken.' }, position: { x: -30, z: -10 }, evidenceId: 'c5_salt_circle', type: 'static' },
        { id: 'c5_clue2', text: { th: 'มีคนทิ้งตำราไสยเวทย์โบราณไว้', en: 'Someone left an ancient grimoire behind.' }, position: { x: 10, z: -25 }, evidenceId: 'c5_grimoire', type: 'static' },
        { id: 'c5_clue3', text: { th: 'คุณได้ยินเสียงคำรามต่ำๆ จากบริเวณที่วงกลมเกลือขาด', en: 'You hear a low growl from where the salt circle was broken.' }, position: { x: -30, z: -12 }, type: 'whisper' },
        { id: 'c5_clue4', text: { th: 'สัญลักษณ์รูปดวงตาถูกวาดไว้บนหน้าตำราที่ถูกฉีก', en: 'An eye symbol is drawn on a torn page from the grimoire.' }, position: { x: 12, z: -28 }, type: 'symbol' },
    ],
    loreObjects: [],
    murdererEvidenceMap: {
        npc1: ['c5_grimoire'], npc2: ['c5_salt_circle'], npc3: ['c5_grimoire'], npc4: ['c5_salt_circle'],
        npc5: ['c5_grimoire', 'c5_salt_circle'], npc6: ['c5_grimoire'], npc7: ['c5_salt_circle']
    },
    genericReactions: {
        murderer: [
            { th: "คุณได้สิ่งนี้มาจากไหน?! มันไม่ใช่ของฉัน!", en: "Where did you get this?! It's not mine!" },
            { th: "นี่มัน... เรื่องเข้าใจผิดกันไปใหญ่แล้ว", en: "This... this is a huge misunderstanding." }
        ],
        innocent: [
            { th: "ฉันไม่เคยเห็นสิ่งนี้มาก่อนเลยในชีวิต", en: "I've never seen this before in my life." },
            { th: "สิ่งนี้เกี่ยวข้องกับเรื่องที่เกิดขึ้นได้อย่างไร?", en: "What does this have to do with anything?" },
            { th: "ดูน่าสนใจนะ แต่มันไม่ใช่ของฉัน", en: "That's interesting, but it's not mine." }
        ]
      }
};

const case6: CaseData = {
    id: "case6",
    title: { th: "มรดกต้องสาป", en: "The Cursed Heirloom" },
    description: {
      th: "การเสียชีวิตอย่างปริศนาเกิดขึ้นกับผู้ที่เพิ่งได้รับมรดกตกทอดเป็นของโบราณชิ้นหนึ่ง หรือว่าคำสาปที่เล่าขานกันมาเกี่ยวกับของชิ้นนี้จะเป็นเรื่องจริง?",
      en: "A mysterious death befalls the recent recipient of a family heirloom. Could the legendary curse associated with this ancient object be real?"
    },
    npcs: {
      npc1: { role: { th: "พยาน #1", en: "Witness #1" }, dialogueTree: placeholderDialogue(['c6_heirloom', 'c6_history_book']) },
      npc2: { role: { th: "พยาน #2", en: "Witness #2" }, dialogueTree: placeholderDialogue(['c6_heirloom', 'c6_history_book']) },
      npc3: { role: { th: "พยาน #3", en: "Witness #3" }, dialogueTree: placeholderDialogue(['c6_heirloom', 'c6_history_book']) },
      npc4: { role: { th: "ชาวบ้าน #1", en: "Villager #1" }, dialogueTree: placeholderDialogue(['c6_heirloom', 'c6_history_book']) },
      npc5: { role: { th: "ชาวบ้าน #2", en: "Villager #2" }, dialogueTree: placeholderDialogue(['c6_heirloom', 'c6_history_book']) },
      npc6: { role: { th: "ชาวบ้าน #3", en: "Villager #3" }, dialogueTree: placeholderDialogue(['c6_heirloom', 'c6_history_book']) },
      npc7: { role: { th: "ชาวบ้าน #4", en: "Villager #4" }, dialogueTree: placeholderDialogue(['c6_heirloom', 'c6_history_book']) },
    },
    suspects: {
        npc1: placeholderSuspects({th: "อิจฉาที่ผู้ตายได้มรดกชิ้นนั้นไป", en: "Was jealous the deceased received the heirloom."}, {th: "กำลังดูแลสวนสมุนไพร", en: "Was tending their herb garden."}),
        npc2: placeholderSuspects({th: "พยายามจะทำลายของต้องสาป แต่ไม่สำเร็จ", en: "Tried to destroy the cursed object, but failed."}, {th: "บอกว่ากำลังเจรจาธุรกิจ", en: "Says they were negotiating a business deal."}),
        npc3: placeholderSuspects({th: "เชื่อว่าตัวเองคือเจ้าของที่แท้จริง", en: "Believes they are the rightful owner."}, {th: "อ้างว่ากำลังศึกษาประวัติศาสตร์หมู่บ้าน", en: "Claims to have been studying village history."}),
        npc4: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
        npc5: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
        npc6: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
        npc7: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
    },
    evidence: [
        { id: 'c6_heirloom', name: { th: 'ปิ่นปักฉันโบราณ', en: 'Ancient Hairpin' }, description: { th: 'ปิ่นปักฉันที่สวยงาม แต่ให้ความรู้สึกเยือกเย็น มีคำสาปสลักไว้', en: 'A beautiful hairpin that feels unnaturally cold, with a curse carved into it.' }, image: `${baseUrl}clue13.png` },
        { id: 'c6_history_book', name: { th: 'บันทึกตระกูล', en: 'Family Chronicle' }, description: { th: 'หนังสือที่เล่าถึงประวัติของต้องสาปและผู้ที่ตกเป็นเหยื่อ', en: 'A book detailing the history of the cursed object and its previous victims.' }, image: `${baseUrl}clue14.png` },
    ],
    clues: [
        { id: 'c6_clue1', text: { th: 'ปิ่นปักฉันโบราณตกอยู่ใกล้ศพ', en: 'An ancient hairpin was dropped near the body.' }, position: { x: 8, z: 8 }, evidenceId: 'c6_heirloom', type: 'static' },
        { id: 'c6_clue2', text: { th: 'บันทึกเก่าแก่เกี่ยวกับคำสาปถูกทิ้งไว้', en: 'An old chronicle about the curse was left behind.' }, position: { x: -18, z: 18 }, evidenceId: 'c6_history_book', type: 'static' },
        { id: 'c6_clue3', text: { th: 'เสียงกระซิบเตือนถึง "ความโลภ" ดังมาจากป้ายหลุมศพเก่า', en: 'A whisper warns of "greed" from an old tombstone.' }, position: { x: -50, z: 10 }, type: 'whisper' },
        { id: 'c6_clue4', text: { th: 'สัญลักษณ์ของตระกูลถูกขีดฆ่าบนต้นไม้', en: 'The family crest has been crossed out on a tree.' }, position: { x: 50, z: -10 }, type: 'symbol' },
    ],
    loreObjects: [],
    murdererEvidenceMap: {
        npc1: ['c6_heirloom'], npc2: ['c6_history_book'], npc3: ['c6_heirloom'], npc4: ['c6_history_book'],
        npc5: ['c6_heirloom'], npc6: ['c6_history_book'], npc7: ['c6_heirloom', 'c6_history_book']
    },
    genericReactions: {
        murderer: [
            { th: "คุณได้สิ่งนี้มาจากไหน?! มันไม่ใช่ของฉัน!", en: "Where did you get this?! It's not mine!" },
            { th: "นี่มัน... เรื่องเข้าใจผิดกันไปใหญ่แล้ว", en: "This... this is a huge misunderstanding." }
        ],
        innocent: [
            { th: "ฉันไม่เคยเห็นสิ่งนี้มาก่อนเลยในชีวิต", en: "I've never seen this before in my life." },
            { th: "สิ่งนี้เกี่ยวข้องกับเรื่องที่เกิดขึ้นได้อย่างไร?", en: "What does this have to do with anything?" },
            { th: "ดูน่าสนใจนะ แต่มันไม่ใช่ของฉัน", en: "That's interesting, but it's not mine." }
        ]
      }
};

const case7: CaseData = {
    id: "case7",
    title: { th: "เจ้าป่าพิโรธ", en: "Wrath of the Forest Guardian" },
    description: {
      th: "ผู้ตายมีชื่อเสียงในทางที่ไม่ดีเกี่ยวกับการลบหลู่ธรรมชาติ ร่างของเขาถูกพบในสภาพเหมือนถูกธรรมชาติลงโทษ มีมอสและเถาวัลย์ขึ้นอยู่เต็มตัว นี่คือคำพิพากษาจากเจ้าป่า หรือมีใครบางคนใช้ความเชื่อนี้เป็นเครื่องมือ?",
      en: "The victim had a reputation for disrespecting nature. Their body was found as if punished by the forest itself, covered in moss and vines. Was this a judgment from a forest guardian, or did someone use this belief as a cover?"
    },
    npcs: {
      npc1: { role: { th: "พยาน #1", en: "Witness #1" }, dialogueTree: placeholderDialogue(['c7_animal_tracks', 'c7_glowing_moss']) },
      npc2: { role: { th: "พยาน #2", en: "Witness #2" }, dialogueTree: placeholderDialogue(['c7_animal_tracks', 'c7_glowing_moss']) },
      npc3: { role: { th: "พยาน #3", en: "Witness #3" }, dialogueTree: placeholderDialogue(['c7_animal_tracks', 'c7_glowing_moss']) },
      npc4: { role: { th: "ชาวบ้าน #1", en: "Villager #1" }, dialogueTree: placeholderDialogue(['c7_animal_tracks', 'c7_glowing_moss']) },
      npc5: { role: { th: "ชาวบ้าน #2", en: "Villager #2" }, dialogueTree: placeholderDialogue(['c7_animal_tracks', 'c7_glowing_moss']) },
      npc6: { role: { th: "ชาวบ้าน #3", en: "Villager #3" }, dialogueTree: placeholderDialogue(['c7_animal_tracks', 'c7_glowing_moss']) },
      npc7: { role: { th: "ชาวบ้าน #4", en: "Villager #4" }, dialogueTree: placeholderDialogue(['c7_animal_tracks', 'c7_glowing_moss']) },
    },
    suspects: {
        npc1: placeholderSuspects({th: "โกรธที่ผู้ตายลบหลู่เจ้าป่า", en: "Was angered by the deceased's disrespect for the forest."}, {th: "กำลังทำพิธีขอขมาป่า", en: "Was performing a ritual to appease the forest."}),
        npc2: placeholderSuspects({th: "เป็นผู้สืบทอดที่ต้องปกป้องผืนป่า", en: "Is a successor sworn to protect the woods."}, {th: "อ้างว่ากำลังลาดตระเวน", en: "Claims to have been on patrol."}),
        npc3: placeholderSuspects({th: "ผู้ตายกำลังจะตัดต้นไม้ศักดิ์สิทธิ์", en: "The deceased was about to cut down a sacred tree."}, {th: "บอกว่ากำลังนั่งสมาธิใต้ต้นไม้ใหญ่", en: "Says they were meditating under the great tree."}),
        npc4: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
        npc5: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
        npc6: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
        npc7: placeholderSuspects({th: "ท่าทางมีพิรุธ", en: "Appears suspicious."}, {th: "อ้างว่าไม่เห็นอะไร", en: "Claims to have seen nothing."}),
    },
    evidence: [
        { id: 'c7_animal_tracks', name: { th: 'รอยเท้าประหลาด', en: 'Unusual Tracks' }, description: { th: 'รอยเท้าสัตว์ที่ไม่เคยเห็นมาก่อน หายไปกลางคัน', en: 'Tracks of an unidentifiable animal that vanish abruptly.' }, image: `${baseUrl}clue15.png` },
        { id: 'c7_glowing_moss', name: { th: 'มอสเรืองแสง', en: 'Glowing Moss' }, description: { th: 'มอสชนิดพิเศษที่ขึ้นอยู่บนตัวผู้ตายเท่านั้น มีพลังงานลึกลับ', en: 'A rare moss that glows with a faint energy, found only on the victim.' }, image: `${baseUrl}clue16.png` },
    ],
    clues: [
        { id: 'c7_clue1', text: { th: 'รอยเท้าสัตว์ประหลาดเดินมาแล้วก็หายไปเฉยๆ', en: 'Strange animal tracks lead here and then simply disappear.' }, position: { x: -25, z: 25 }, evidenceId: 'c7_animal_tracks', type: 'static' },
        { id: 'c7_clue2', text: { th: 'มีมอสเรืองแสงเกาะอยู่ตามร่างกายผู้ตาย', en: 'Glowing moss is growing on the deceased\'s body.' }, position: { x: 5, z: -30 }, evidenceId: 'c7_glowing_moss', type: 'static' },
        { id: 'c7_clue3', text: { th: 'เสียงคำรามของสัตว์ป่าที่ฟังดูโกรธเกรี้ยวดังมาจากส่วนที่ลึกที่สุดของป่า', en: 'An angry animal roar echoes from the deepest part of the woods.' }, position: { x: -45, z: 45 }, type: 'whisper' },
        { id: 'c7_clue4', text: { th: 'สัญลักษณ์ของธรรมชาติถูกวาดไว้บนศาลเจ้าที่ถูกทิ้งร้าง', en: 'A nature symbol is painted on a derelict shrine.' }, position: { x: 45, z: -45 }, type: 'symbol' },
    ],
    loreObjects: [],
    murdererEvidenceMap: {
        npc1: ['c7_glowing_moss'], npc2: ['c7_animal_tracks'], npc3: ['c7_glowing_moss'], npc4: ['c7_animal_tracks'],
        npc5: ['c7_glowing_moss'], npc6: ['c7_animal_tracks'], npc7: ['c7_animal_tracks', 'c7_glowing_moss']
    },
    genericReactions: {
        murderer: [
            { th: "คุณได้สิ่งนี้มาจากไหน?! มันไม่ใช่ของฉัน!", en: "Where did you get this?! It's not mine!" },
            { th: "นี่มัน... เรื่องเข้าใจผิดกันไปใหญ่แล้ว", en: "This... this is a huge misunderstanding." }
        ],
        innocent: [
            { th: "ฉันไม่เคยเห็นสิ่งนี้มาก่อนเลยในชีวิต", en: "I've never seen this before in my life." },
            { th: "สิ่งนี้เกี่ยวข้องกับเรื่องที่เกิดขึ้นได้อย่างไร?", en: "What does this have to do with anything?" },
            { th: "ดูน่าสนใจนะ แต่มันไม่ใช่ของฉัน", en: "That's interesting, but it's not mine." }
        ]
      }
};

export const allCases: CaseData[] = [case0, case1, case2, case3, case4, case5, case6, case7];
