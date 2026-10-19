import { useState, type FormEvent } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './App.css'

type Meal = {
  id: number
  name: string
  category: string
  calories: number
  protein: number
  carbs: number
  fats: number
  ingredients: string[]
  instructions: string[]
  custom?: boolean
}
type LoggedMeal = { logId: number; mealId: number; servings: number; date: string }
type PlannedMeal = { planId: number; mealId: number; servings: number; date: string }
type MealForm = { name: string; category: string; calories: string; protein: string; carbs: string; fats: string; ingredients: string; instructions: string }

const builtInMeals: Meal[] = [
  { id: 1, name: 'Chicken Rice Bowl', category: 'Lunch', calories: 520, protein: 48, carbs: 55, fats: 12,
    ingredients: ['150g cooked chicken breast', '150g cooked rice', '1 cup broccoli', '1 tsp olive oil'],
    instructions: ['Cook and season the chicken.', 'Prepare the rice and broccoli.', 'Combine everything in a bowl.'] },
  { id: 2, name: 'Greek Yogurt Protein Bowl', category: 'Breakfast', calories: 310, protein: 32, carbs: 35, fats: 5,
    ingredients: ['200g plain nonfat Greek yogurt', '75g berries', '20g granola', '1 tbsp chia seeds'],
    instructions: ['Add yogurt to a bowl.', 'Top with berries, granola, and chia seeds.', 'Mix and enjoy.'] },
  { id: 3, name: 'Turkey Wrap', category: 'Lunch', calories: 430, protein: 39, carbs: 40, fats: 13,
    ingredients: ['1 large whole wheat tortilla', '120g cooked turkey breast', 'Lettuce and tomato', '2 tbsp hummus'],
    instructions: ['Spread hummus over the tortilla.', 'Add turkey and vegetables.', 'Roll tightly and serve.'] },
  { id: 4, name: 'Salmon and Sweet Potato', category: 'Dinner', calories: 610, protein: 45, carbs: 45, fats: 27,
    ingredients: ['170g salmon', '200g sweet potato', '1 cup asparagus', '1 tsp olive oil'],
    instructions: ['Bake the sweet potato until tender.', 'Season and bake the salmon until cooked.', 'Cook asparagus and serve together.'] },
  { id: 5, name: 'Egg and Cottage Cheese Toast', category: 'Breakfast', calories: 370, protein: 34, carbs: 30, fats: 13,
    ingredients: ['2 eggs', '100g low-fat cottage cheese', '2 slices whole grain toast', 'Salt and pepper'],
    instructions: ['Scramble or fry the eggs.', 'Toast the bread.', 'Serve with cottage cheese and seasonings.'] },
  { id: 6, name: 'Beef Burrito Bowl', category: 'Dinner', calories: 650, protein: 51, carbs: 60, fats: 22,
    ingredients: ['150g lean cooked ground beef', '120g cooked rice', '100g black beans', 'Salsa and lettuce'],
    instructions: ['Cook the beef with seasoning.', 'Prepare rice and warm the beans.', 'Combine ingredients and add salsa.'] },
  { id: 7, name: 'Protein Smoothie', category: 'Snack', calories: 340, protein: 35, carbs: 42, fats: 6,
    ingredients: ['1 scoop whey protein', '1 banana', '240ml low-fat milk', 'Ice'],
    instructions: ['Add everything to a blender.', 'Blend until smooth.', 'Pour into a glass.'] },
  { id: 8, name: 'Tuna Sandwich', category: 'Lunch', calories: 390, protein: 37, carbs: 39, fats: 10,
    ingredients: ['1 can tuna in water, drained', '2 slices whole wheat bread', '1 tbsp light mayonnaise', 'Lettuce and tomato'],
    instructions: ['Mix tuna with mayonnaise.', 'Add vegetables to bread.', 'Assemble the sandwich.'] },
]

const emptyForm: MealForm = { name: '', category: 'Breakfast', calories: '', protein: '', carbs: '', fats: '', ingredients: '', instructions: '' }

function loadJson<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback }
  catch { return fallback }
}
function loadGoal(key: string, fallback: number) {
  try { const n = Number(localStorage.getItem(key)); return Number.isFinite(n) && n > 0 ? n : fallback }
  catch { return fallback }
}
function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function shiftDate(day: string, offset: number) {
  const date = new Date(`${day}T12:00:00`)
  date.setDate(date.getDate() + offset)
  return localDate(date)
}
function nutrition(items: { mealId: number; servings: number }[], meals: Meal[]) {
  return items.reduce((t, item) => {
    const meal = meals.find(m => m.id === item.mealId)
    if (!meal) return t
    return { calories: t.calories + meal.calories * item.servings,
      protein: t.protein + meal.protein * item.servings,
      carbs: t.carbs + meal.carbs * item.servings,
      fats: t.fats + meal.fats * item.servings }
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 })
}
function uid() { return Date.now() + Math.random() }
function Progress({ label, value, goal, color, unit }: { label: string; value: number; goal: number; color: string; unit: string }) {
  const remaining = goal - value
  return <div className="macro-card">
    <div className="macro-heading"><span>{label}</span><strong>{Math.round(value)} {unit}</strong></div>
    <div className="macro-progress"><div className="macro-progress-fill" style={{ width: `${Math.min(100, value / goal * 100)}%`, backgroundColor: color }} /></div>
    <div className="macro-footer"><span>Goal: {goal} {unit}</span><span>{Math.round(Math.abs(remaining))} {remaining >= 0 ? 'remaining' : 'over goal'}</span></div>
  </div>
}

function App() {
  const [customMeals, setCustomMeals] = useState<Meal[]>(() => loadJson('proteinPlannerCustomMeals', []))
  const [log, setLog] = useState<LoggedMeal[]>(() => loadJson('proteinPlannerLog', []))
  const [plan, setPlan] = useState<PlannedMeal[]>(() => loadJson('proteinPlannerPlan', []))
  const [calorieGoal, setCalorieGoal] = useState(() => loadGoal('proteinPlannerCalories', 2200))
  const [proteinGoal, setProteinGoal] = useState(() => loadGoal('proteinPlannerProtein', 150))
  const [carbGoal, setCarbGoal] = useState(() => loadGoal('proteinPlannerCarbs', 250))
  const [fatGoal, setFatGoal] = useState(() => loadGoal('proteinPlannerFats', 70))
  const [currentDate, setCurrentDate] = useState(() => localDate(new Date()))
  const [planDate, setPlanDate] = useState(() => localDate(new Date()))
  const [search, setSearch] = useState('')
  const [minProtein, setMinProtein] = useState(0)
  const [maxCalories, setMaxCalories] = useState(1000)
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)
  const [servings, setServings] = useState(1)
  const [editingLog, setEditingLog] = useState<LoggedMeal | null>(null)
  const [editServings, setEditServings] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingMealId, setEditingMealId] = useState<number | null>(null)
  const [form, setForm] = useState<MealForm>(emptyForm)
  const [formError, setFormError] = useState('')

  const meals = [...builtInMeals, ...customMeals]
  const todaysLog = log.filter(item => item.date === currentDate)
  const totals = nutrition(todaysLog, meals)
  const remainingCalories = calorieGoal - totals.calories
  const remainingProtein = proteinGoal - totals.protein
  const filteredMeals = meals.filter(meal => meal.name.toLowerCase().includes(search.toLowerCase()) && meal.protein >= minProtein && meal.calories <= maxCalories)
  const suggestions = meals.filter(meal => remainingProtein > 0 && meal.calories <= remainingCalories).sort((a, b) => Math.abs(remainingProtein - a.protein) - Math.abs(remainingProtein - b.protein)).slice(0, 3)
  const week = Array.from({ length: 7 }, (_, index) => shiftDate(currentDate, index - 6))
  const weeklyData = week.map(date => ({ date, day: new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' }), ...nutrition(log.filter(item => item.date === date), meals) }))
  const averageCalories = Math.round(weeklyData.reduce((n, day) => n + day.calories, 0) / 7)
  const averageProtein = Math.round(weeklyData.reduce((n, day) => n + day.protein, 0) / 7)

  function saveLog(next: LoggedMeal[]) { setLog(next); localStorage.setItem('proteinPlannerLog', JSON.stringify(next)) }
  function savePlan(next: PlannedMeal[]) { setPlan(next); localStorage.setItem('proteinPlannerPlan', JSON.stringify(next)) }
  function saveMeals(next: Meal[]) { setCustomMeals(next); localStorage.setItem('proteinPlannerCustomMeals', JSON.stringify(next)) }
  function goal(value: number, key: string, setter: (v: number) => void) {
    const valid = Number.isFinite(value) ? Math.max(1, value) : 1
    setter(valid); localStorage.setItem(key, String(valid))
  }
  function addMeal(meal: Meal, amount = 1, date = currentDate) {
    saveLog([...log, { logId: uid(), mealId: meal.id, servings: amount, date }]); setSelectedMeal(null); setServings(1)
  }
  function addPlan(meal: Meal) { savePlan([...plan, { planId: uid(), mealId: meal.id, servings: 1, date: planDate }]) }
  function beginEditLog(item: LoggedMeal) { setEditingLog(item); setEditServings(item.servings) }
  function saveLogEdit() {
    if (!editingLog) return
    saveLog(log.map(item => item.logId === editingLog.logId ? { ...item, servings: editServings } : item))
    setEditingLog(null)
  }
  function openCreate() { setEditingMealId(null); setForm(emptyForm); setFormError(''); setFormOpen(true) }
  function openEdit(meal: Meal) {
    setEditingMealId(meal.id)
    setForm({ name: meal.name, category: meal.category, calories: String(meal.calories), protein: String(meal.protein), carbs: String(meal.carbs), fats: String(meal.fats), ingredients: meal.ingredients.join('\n'), instructions: meal.instructions.join('\n') })
    setFormError(''); setFormOpen(true)
  }
  function saveMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = [form.calories, form.protein, form.carbs, form.fats].map(Number)
    if (!form.name.trim() || [form.calories, form.protein, form.carbs, form.fats].some(v => v.trim() === '') || values.some(v => !Number.isFinite(v) || v < 0)) {
      setFormError('Enter a meal name and valid, nonnegative nutrition values.'); return
    }
    const meal: Meal = { id: editingMealId ?? uid(), name: form.name.trim(), category: form.category,
      calories: values[0], protein: values[1], carbs: values[2], fats: values[3], custom: true,
      ingredients: form.ingredients.split('\n').map(s => s.trim()).filter(Boolean),
      instructions: form.instructions.split('\n').map(s => s.trim()).filter(Boolean) }
    saveMeals(editingMealId === null ? [...customMeals, meal] : customMeals.map(m => m.id === editingMealId ? meal : m))
    setFormOpen(false)
  }
  function deleteCustom(meal: Meal) {
    if (!window.confirm(`Delete ${meal.name}? Its food log and meal plan entries will also be removed.`)) return
    saveMeals(customMeals.filter(m => m.id !== meal.id))
    saveLog(log.filter(item => item.mealId !== meal.id))
    savePlan(plan.filter(item => item.mealId !== meal.id))
    setSelectedMeal(null)
  }
  const servingsOptions = [0.5, 1, 1.5, 2, 3, 4]

  return <div className="app">
    <header className="header"><div className="container header-content"><div className="brand"><span className="brand-icon">◆</span>Protein Planner</div><span className="header-label">Your nutrition dashboard</span></div></header>
    <main className="container">
      <section className="hero"><div><p className="eyebrow">EAT SMARTER. TRACK EASIER.</p><h1>Fuel your goals.</h1><p className="subtitle">Track your macros, create meals, and plan your week.</p></div><div className="hero-date"><label htmlFor="log-date">Viewing food log for</label><input id="log-date" type="date" value={currentDate} onChange={e => setCurrentDate(e.target.value)} /></div></section>

      <section className="dashboard-grid">
        <div className="panel"><h2>Daily goals</h2><p className="muted">Customize your nutrition targets.</p><div className="goal-inputs">
          {([['Calories (kcal)', calorieGoal, 'proteinPlannerCalories', setCalorieGoal], ['Protein (g)', proteinGoal, 'proteinPlannerProtein', setProteinGoal], ['Carbs (g)', carbGoal, 'proteinPlannerCarbs', setCarbGoal], ['Fats (g)', fatGoal, 'proteinPlannerFats', setFatGoal]] as const).map(([label, value, key, setter]) => <label key={key}>{label}<input type="number" min="1" value={value} onChange={e => goal(Number(e.target.value), key, setter)} /></label>)}
        </div></div>
        <div className="panel"><h2>Nutrition overview</h2><p className="muted">Progress for {currentDate}</p><div className="nutrition-summary"><div><span>Total consumed</span><h3>{Math.round(totals.calories)} kcal</h3></div><div><span>Remaining calories</span><h3>{Math.round(remainingCalories)} kcal</h3></div></div>
          <Progress label="Calories" value={totals.calories} goal={calorieGoal} color="#e9a35d" unit="kcal" />
          <Progress label="Protein" value={totals.protein} goal={proteinGoal} color="#169678" unit="g" />
          <Progress label="Carbs" value={totals.carbs} goal={carbGoal} color="#6096d6" unit="g" />
          <Progress label="Fats" value={totals.fats} goal={fatGoal} color="#b585d9" unit="g" />
        </div>
      </section>

      <section className="section"><div className="section-heading"><div><p className="eyebrow">MEAL DISCOVERY</p><h2>Find your next meal</h2></div><button className="primary-button" onClick={openCreate}>+ Create custom meal</button></div>
        <div className="filters"><label>Search meals<input type="search" placeholder="Search meals..." value={search} onChange={e => setSearch(e.target.value)} /></label><label>Minimum protein (g)<input type="number" min="0" value={minProtein} onChange={e => setMinProtein(Math.max(0, Number(e.target.value) || 0))} /></label><label>Maximum calories<input type="number" min="0" value={maxCalories} onChange={e => setMaxCalories(Math.max(0, Number(e.target.value) || 0))} /></label></div>
        <p className="muted">{filteredMeals.length} meals found · Nutrition figures are estimates.</p>
        <div className="meal-grid">{filteredMeals.map(meal => <article className="meal-card" key={meal.id}><div className="meal-top"><span className="category">{meal.custom ? 'Custom · ' : ''}{meal.category}</span><span className="meal-icon">✦</span></div><h3>{meal.name}</h3><div className="nutrition"><span><strong>{meal.calories}</strong> kcal</span><span><strong>{meal.protein}g</strong> protein</span><span><strong>{meal.carbs}g</strong> carbs</span><span><strong>{meal.fats}g</strong> fats</span></div><p className="estimate">Estimated nutrition per serving</p><div className="meal-actions"><button className="secondary-button" onClick={() => { setSelectedMeal(meal); setServings(1) }}>View recipe</button><button className="primary-button" onClick={() => addMeal(meal)}>+ Add</button></div><div className="extra-actions"><button onClick={() => addPlan(meal)}>Plan for {planDate}</button>{meal.custom && <><button onClick={() => openEdit(meal)}>Edit</button><button onClick={() => deleteCustom(meal)}>Delete</button></>}</div></article>)}</div>
        {filteredMeals.length === 0 && <p className="empty">No meals match your filters.</p>}
      </section>

      <section className="section"><div className="section-heading"><div><p className="eyebrow">WEEKLY MEAL PLANNER</p><h2>Plan meals ahead</h2></div><label className="date-control">Schedule meals for<input type="date" value={planDate} onChange={e => setPlanDate(e.target.value)} /></label></div>
        <p className="muted">Choose a date above, then click “Plan” on a meal. Planned meals are separate from your food log until you log them.</p>
        <div className="planner-grid">{week.map(date => <div className="planner-day" key={date}><strong>{new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
          {plan.filter(item => item.date === date).length === 0 ? <p className="muted">Nothing planned</p> : plan.filter(item => item.date === date).map(item => { const meal = meals.find(m => m.id === item.mealId); if (!meal) return null; return <div className="planned-item" key={item.planId}><span>{meal.name}</span><small>{item.servings} serving(s) · {meal.calories * item.servings} kcal</small><div className="extra-actions"><button onClick={() => addMeal(meal, item.servings, date)}>Log it</button><button onClick={() => savePlan(plan.filter(p => p.planId !== item.planId))}>Remove</button></div></div> })}
        </div>)}</div><p className="muted">Showing the 7 days ending on your selected food-log date. Change that date above to view a different week.</p>
      </section>

      <section className="section"><div className="section-heading"><div><p className="eyebrow">YOUR PROGRESS</p><h2>Weekly Nutrition Analytics</h2></div><span className="result-count">Last 7 days</span></div><div className="dashboard-grid"><div className="panel"><h2>Calorie History</h2><p className="muted">Daily calories logged over 7 days.</p><div style={{ height: 260 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis /><Tooltip /><Bar dataKey="calories" fill="#e9a35d" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div><div className="panel"><h2>Protein History</h2><p className="muted">Daily protein logged over 7 days.</p><div style={{ height: 260 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis /><Tooltip /><Bar dataKey="protein" fill="#169678" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div></div><div className="weekly-summary"><div className="weekly-stat"><span>Average Daily Calories</span><strong>{averageCalories} kcal</strong></div><div className="weekly-stat"><span>Average Daily Protein</span><strong>{averageProtein} g</strong></div></div></section>

      <section className="bottom-grid"><div className="panel"><h2>Food log</h2><p className="muted">Meals logged for {currentDate}.</p>{todaysLog.length === 0 ? <p className="empty">No meals logged yet.</p> : <div className="log-list">{todaysLog.map(item => { const meal = meals.find(m => m.id === item.mealId); if (!meal) return null; return <div className="log-item" key={item.logId}><div><strong>{meal.name} · {item.servings} serving(s)</strong><p>{Math.round(meal.calories * item.servings)} kcal · {Math.round(meal.protein * item.servings)}g protein · {Math.round(meal.carbs * item.servings)}g carbs · {Math.round(meal.fats * item.servings)}g fats</p></div><div className="log-buttons"><button className="secondary-button" onClick={() => beginEditLog(item)}>Edit</button><button className="remove-button" onClick={() => saveLog(log.filter(l => l.logId !== item.logId))}>Remove</button></div></div> })}</div>}</div><div className="panel suggestion-panel"><p className="eyebrow">SMART PICKS</p><h2>Meals that fit your day</h2><p className="muted">Suggestions based on remaining calories and protein.</p>{suggestions.length === 0 ? <p className="empty">No suggestions fit your remaining calories.</p> : <div className="suggestions">{suggestions.map(meal => <button className="suggestion" key={meal.id} onClick={() => { setSelectedMeal(meal); setServings(1) }}><span>{meal.name}</span><small>{meal.calories} kcal · {meal.protein}g protein →</small></button>)}</div>}</div></section>
      <footer>Protein Planner · All nutrition values are estimates, not verified dietary information.</footer>
    </main>

    {selectedMeal && <div className="modal-backdrop" onClick={() => setSelectedMeal(null)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="recipe-title" onClick={e => e.stopPropagation()}><button className="close-button" onClick={() => setSelectedMeal(null)} aria-label="Close recipe">×</button><span className="category">{selectedMeal.category}</span><h2 id="recipe-title">{selectedMeal.name}</h2><p className="modal-nutrition">{Math.round(selectedMeal.calories * servings)} kcal · {Math.round(selectedMeal.protein * servings)}g protein · {Math.round(selectedMeal.carbs * servings)}g carbs · {Math.round(selectedMeal.fats * servings)}g fats</p><p className="estimate">Estimated nutrition. Ingredients below are listed for one serving.</p><h3>Ingredients</h3>{selectedMeal.ingredients.length ? <ul>{selectedMeal.ingredients.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p>No ingredients provided.</p>}<h3>Instructions</h3>{selectedMeal.instructions.length ? <ol>{selectedMeal.instructions.map((s, i) => <li key={i}>{s}</li>)}</ol> : <p>No instructions provided.</p>}<div className="serving-selector"><label htmlFor="servings">Serving size</label><select id="servings" value={servings} onChange={e => setServings(Number(e.target.value))}>{servingsOptions.map(n => <option value={n} key={n}>{n} serving(s)</option>)}</select></div><button className="primary-button modal-add" onClick={() => addMeal(selectedMeal, servings)}>+ Add to food log</button></div></div>}

    {editingLog && <div className="modal-backdrop" onClick={() => setEditingLog(null)}><div className="modal small-modal" role="dialog" aria-modal="true" aria-labelledby="edit-log-title" onClick={e => e.stopPropagation()}><button className="close-button" onClick={() => setEditingLog(null)} aria-label="Close">×</button><h2 id="edit-log-title">Edit logged servings</h2><div className="serving-selector"><label htmlFor="edit-servings">Serving size</label><select id="edit-servings" value={editServings} onChange={e => setEditServings(Number(e.target.value))}>{servingsOptions.map(n => <option value={n} key={n}>{n} serving(s)</option>)}</select></div><button className="primary-button modal-add" onClick={saveLogEdit}>Save changes</button></div></div>}

    {formOpen && <div className="modal-backdrop" onClick={() => setFormOpen(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title" onClick={e => e.stopPropagation()}><button className="close-button" onClick={() => setFormOpen(false)} aria-label="Close">×</button><h2 id="form-title">{editingMealId === null ? 'Create a custom meal' : 'Edit custom meal'}</h2><form className="custom-meal-form" onSubmit={saveMeal}><label>Meal name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Homemade chicken pasta" /></label><label>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(s => <option key={s}>{s}</option>)}</select></label><div className="form-nutrients">{(['calories', 'protein', 'carbs', 'fats'] as const).map(key => <label key={key}>{key === 'calories' ? 'Calories (kcal)' : `${key[0].toUpperCase() + key.slice(1)} (g)`}<input type="number" min="0" step="any" required value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>)}</div><label>Ingredients (one per line)<textarea rows={4} value={form.ingredients} onChange={e => setForm({ ...form, ingredients: e.target.value })} /></label><label>Instructions (one per line)<textarea rows={4} value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} /></label>{formError && <p className="form-error" role="alert">{formError}</p>}<button className="primary-button" type="submit">{editingMealId === null ? 'Save new meal' : 'Save meal changes'}</button></form></div></div>}
  </div>
}
export default App
