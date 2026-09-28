const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Petit helper pour lire data.json
function readData() {
  const rootPath = path.join(__dirname, "data.json");
  const frontendPath = path.join(__dirname, "frontend", "public", "data.json");
  const filePath = fs.existsSync(rootPath) ? rootPath : frontendPath;
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

// Route test (sanity check, parce qu’on ne fait pas confiance à la vie)
app.get("/", (req, res) => {
  res.json({ message: "CookMate API is alive 🍳" });
});

// Récupérer tous les ingrédients
app.get("/ingredients", (req, res) => {
  const data = readData();
  res.json(data.ingredients);
});

// Récupérer toutes les recettes
app.get("/recipes", (req, res) => {
  const data = readData();
  res.json(data.recipes);
});

// Recherche par ingrédients
app.post("/search", (req, res) => {
  const { ingredientIds = [] } = req.body;
  const data = readData();

  const results = data.recipes.map((recipe) => {
    const required = recipe.ingredients;
    const matched = required.filter((id) => ingredientIds.includes(id));

    const matchedCount = matched.length;
    const requiredCount = required.length;

    const score = Math.floor((matchedCount * 100) / (requiredCount || 1));
    const missing = required.filter((id) => !ingredientIds.includes(id));

    return {
      ...recipe,
      matchedCount,
      requiredCount,
      missing,
      score,
    };
  });

  // Trier par score décroissant
  results.sort((a, b) => b.score - a.score);

  res.json(results);
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`🔥 CookMate backend running on http://localhost:${PORT}`);
});

// GET /recipe/:id
app.get("/recipe/:id", (req, res) => {
  const { id } = req.params;
  const data = readData();
  const recipe = data.recipes.find(r => r.id === parseInt(id));
  if (!recipe) return res.status(404).json({ error: "Recette non trouvée" });
  res.json(recipe);
});
