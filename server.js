const express = require("express");
const app = express();
require("dotenv").config();
const { Client } = require("@notionhq/client");
const path = require("path");

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.DATABASE_ID;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Function to extract question data from Notion page
const getQuestionObject = (page) => {
  try {
    return {
      question: {
        id: page.id,
        plain_text: page.properties.Name.title[0].plain_text,
      },
      question_type: page.properties["question type"].multi_select.map(
        (type) => ({
          name: type.name,
        })
      ),
      quality: {
        id: page.properties.quality.select?.id || "",
        name: page.properties.quality.select?.name || "",
        color: page.properties.quality.select?.color || "",
      },
    };
  } catch (error) {
    console.error("Error processing page:", page.id, error);
    return null;
  }
};

// API endpoint to get questions
app.get("/api/questions", async (req, res) => {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "Check",
        checkbox: {
          equals: true,
        },
      },
    });

    const questionList = await Promise.all(
      response.results.map(async (page) => getQuestionObject(page))
    );

    // Filter out any null values from failed processing
    const validQuestions = questionList.filter((q) => q !== null);

    res.json(validQuestions);
  } catch (error) {
    console.error("Error fetching Notion database:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// Catch-all route to serve index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Only listen to port if running directly (not in Vercel)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express app for Vercel
module.exports = app;
