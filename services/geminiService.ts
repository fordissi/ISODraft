
import { GoogleGenAI, Type } from "@google/genai";
import { ISODocLevel, ToneType } from "../types";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateISODocContent = async (
  topic: string,
  level: ISODocLevel,
  category: string,
  tone: ToneType,
  context: string
) => {
  const ai = getClient();
  
  let toneInstruction = "";
  if (tone === 'standard') {
    toneInstruction = "語氣必須客觀、精確，多使用「應」、「必須」、「確保」等規範性詞彙，遵循標準 ISO 程序書寫作風格。";
  } else if (tone === 'hr') {
    toneInstruction = "語氣專業但親切、易於閱讀，著重於溝通與指導，明確描述員工權利與義務。";
  } else if (tone === 'official') {
    toneInstruction = "語氣高度正式且具備官僚公文美感，使用公文術語如「鈞座」、「函覆」、「鑒核」等，格式必須嚴謹。";
  }

  const prompt = `
    你是一位資深的 ISO 9001:2015 顧問與技術撰寫專家。
    請根據以下資訊生成專業、結構化且視覺清晰的文件內容：
    主題：${topic}
    文件階層：${level}
    文件類別：${category}
    風格語氣：${tone} (${toneInstruction})
    背景資訊：${context}

    ### 核心排版規則 (STRICTLY FOLLOW):

    1. **Mermaid 流程圖 (對程序書至關重要):**
       - 如果文件是「Level 2: Procedures (程序書)」或描述複雜流程：
       - 你 **必須** 包含一個 Mermaid 流程圖來視覺化作業步驟。
       - 使用 \`graph TD\` (由上而下) 語法。
       - 必須包裹在 \`\`\`mermaid ... \`\`\` 代碼塊中。
       - 範例：
         \`\`\`mermaid
         graph TD
           A((開始)) --> B[步驟一]
           B --> C{是否合格?}
           C -- 是 --> D[核准]
           C -- 否 --> E[退回]
           D --> F((結束))
         \`\`\`

    2. **Markdown 表格 (對表單與紀錄至關重要):**
       - 如果文件是「Level 4: Records/Forms (表單與紀錄)」：
       - 不要只使用清單，**必須** 使用 Markdown 表格來模擬表單版面。
       - 包含標題列、檢查項目、結果欄位與備註。

    3. **強化格式化：**
       - 使用 **粗體** 強調關鍵職責、動作或期限。
       - 使用 > 引用區塊 (Blockquotes) 來標註「注意事項」、「警告」或「重要政策」。
       - 使用有序或無序清單描述詳細步驟。

    ### 內容生成邏輯：

    **情境 A：手冊與程序書 (Level 1 & Level 2)**
    - 結構必須包含：
      1. 目的 (Purpose)
      2. 範圍 (Scope)
      3. 定義 (Definitions)
      4. 作業流程圖 (Process Flow) -> **在此插入 MERMAID**
      5. 作業內容詳述 (Detailed Procedure)
      6. 權責 (Responsibilities)

    **情境 B：表單與紀錄 (Level 4)**
    - 內容應直接呈現可列印的表單樣式。
    - 包含：表頭資訊 (單位/日期/人員)、主體表格 -> **在此插入 MARKDOWN TABLE**、表尾簽署區。

    **情境 C：行政公文 (Admin)**
    - 使用標準公文格式：[主旨]、[說明]、[辦法]。
    - 使用佔位符如 {{受文者}}、{{發文日期}}。

    請以繁體中文撰寫，並確保輸出為合法的 JSON 格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["title", "content"]
              }
            }
          },
          required: ["sections"]
        }
      }
    });

    const text = response.text;
    return JSON.parse(text || '{"sections": []}');
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};

export const refineContent = async (
  content: string,
  action: 'polish' | 'check' | 'tone_official'
): Promise<string> => {
  const ai = getClient();
  let prompt = "";

  if (action === 'polish') {
    prompt = `
      任務：潤飾以下 ISO 文件段落。
      目標：修正語法錯誤，提升專業度，確保語氣客觀精確（ISO 標準風格）。
      規則：
      1. 保留原有的 Markdown 格式（如表格、粗體）。
      2. 移除冗言贅字。
      3. **只回傳潤飾後的內容**，不要包含任何開場白或解釋。
      
      原文：
      ${content}
    `;
  } else if (action === 'check') {
    prompt = `
      任務：檢查以下 ISO 文件段落的合規性與完整性。
      目標：找出模糊不清的職責、未定義的範圍或潛在的 ISO 9001 不符合項。
      規則：
      1. 請列出 3-5 點具體的改進建議或警告。
      2. 使用條列式清單。
      3. 若內容看起來沒問題，請回覆「內容結構符合標準，無明顯缺失。」
      
      原文：
      ${content}
    `;
  } else if (action === 'tone_official') {
    prompt = `
      任務：將以下內容改寫為「正式公文 (Official Business Correspondence)」風格。
      目標：使用台灣公文用語（如：鈞座、函覆、辦理、為荷），展現高度專業與行政權威。
      規則：
      1. 結構應包含：主旨、說明、辦法（若適用）。
      2. **只回傳改寫後的內容**，不要包含解釋。
      
      原文：
      ${content}
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster edits
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("AI Refine Error:", error);
    return content; // Return original on error
  }
};
