import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import "./index.css";

// Page d'accueil avec sélection d'ingrédients + recettes
function Home() {
  const [ingredients, setIngredients] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Charger data.json depuis public/
  useEffect(() => {
    fetch("/data.json")
      .then(res => res.json())
      .then(data => {
        setIngredients(data.ingredients);
        setRecipes([]); // initialement vide
        window.allRecipes = data.recipes; // pour la page détail
      })
      .catch(err => console.error(err));
  }, []);

  const toggle = (id) => {
    const ns = new Set(selected);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    setSelected(ns);
    window.selectedIngredients = ns; // global pour la page détail
  };

  const searchRecipes = () => {
    if (!window.allRecipes) return;
    const scoredRecipes = window.allRecipes.map(r => {
      const total = r.ingredients.length;
      const have = r.ingredients.filter(i => selected.has(i)).length;
      const score = Math.round((have / total) * 100);
      const missing = r.ingredients
        .filter(i => !selected.has(i))
        .map(i => ingredients.find(ing => ing.id === i)?.name || "");
      return { ...r, score, missing };
    }).filter(r => r.score > 0);
    setRecipes(scoredRecipes);
  };

  const filteredIngredients = ingredients.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1>CookMate 🍳</h1>

      <div className="ingredients-container">
        <input
          type="text"
          placeholder="Rechercher un ingrédient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="ingredients-list">
          {filteredIngredients.map(i => (
            <div key={i.id} onClick={() => toggle(i.id)}>
              <input
                type="checkbox"
                checked={selected.has(i.id)}
                onChange={() => toggle(i.id)}
              />
              {i.name}
            </div>
          ))}
        </div>

        <button onClick={searchRecipes} className="search-btn">
          Trouver des recettes
        </button>
      </div>

      <div className="recipes-grid">
        {recipes.length === 0 && <p>Aucune recette trouvée.</p>}
        {recipes.map(r => (
          <div
            key={r.id}
            className="recipe-card"
            onClick={() => navigate(`/recipe/${r.id}`)}
            style={{ cursor: "pointer" }}
          >
            <h3>{r.title}</h3>
            <span
              className={`score ${r.score === 100 ? "high" : r.score >= 50 ? "medium" : "low"}`}
            >
              {r.score}%
            </span>
            <p>Temps: {r.timeMin} min</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Page détail d'une recette
function RecipeDetail() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState(new Set());

  useEffect(() => {
    fetch("/data.json")
      .then(res => res.json())
      .then(data => {
        setIngredients(data.ingredients);
        setSelectedIngredients(window.selectedIngredients || new Set());
        const r = data.recipes.find(r => r.id === parseInt(id));
        setRecipe(r);
      })
      .catch(err => console.error(err));
  }, [id]);

  if (!recipe) return <p>Chargement...</p>;

  const missing = recipe.ingredients
    .filter(i => !selectedIngredients.has(i))
    .map(i => ingredients.find(ing => ing.id === i)?.name || "");

  return (
    <div className="recipe-detail-container">
      <h1>{recipe.title} 🍽️</h1>
      <span className="time-badge">Temps: {recipe.timeMin} min</span>

      <h2>Ingrédients :</h2>
      <ul>
        {recipe.ingredients.map((ingId, idx) => {
          const ingName = ingredients.find(ing => ing.id === ingId)?.name || "";
          return (
            <li key={idx} className={missing.includes(ingName) ? "missing" : ""}>
              {ingName}{missing.includes(ingName) ? " (à rajouter)" : ""}
            </li>
          );
        })}
      </ul>

      <h2>Préparation :</h2>
      <pre style={{ whiteSpace: "pre-wrap", background: "#fff8e7", padding: "10px", borderRadius: "8px" }}>
        {recipe.instructions || "Pas de marche à suivre disponible pour le moment."}
      </pre>

      <Link to="/">
        <button style={{ marginTop: "15px" }}>← Retour aux recettes</button>
      </Link>
    </div>
  );
}

// App avec Router
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
      </Routes>
    </Router>
  );
}
