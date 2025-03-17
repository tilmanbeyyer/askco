require("dotenv").config();
const { Client } = require("@notionhq/client");

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const getQuestionObject = (page) => {
  const plain_text_question = page.properties.Name.title[0].plain_text;

  const question_type = page.properties["question type"].multi_select;

  const quality = page.properties.quality.select;

  return {
    question: { id: page.id, plain_text: plain_text_question },
    question_type: question_type,
    quality: quality,
  };
};

(async () => {
  try {
    const databaseId = "1b9baf3ddf7480feaf76d4a82fc37c7b"; // Replace with your actual Notion database ID

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "Check",
        checkbox: {
          equals: true,
        },
      },
    });

    const pageIdList = response.results.map((obj) => obj.id);

    const questionList = [];

    await Promise.all(
      pageIdList.map(async (pageId) => {
        const page = await notion.pages.retrieve({
          page_id: pageId,
        });

        const question_obj = getQuestionObject(page);

        questionList.push(question_obj);
      })
    );

    console.log(questionList);
  } catch (error) {
    console.error("Error fetching Notion database:", error.message);
  }
})();
