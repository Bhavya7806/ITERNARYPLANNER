# backend/main.py
import os
import json
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
from ortools.algorithms.python import knapsack_solver

# Load Environment Variables
load_dotenv()

# Configure Gemini AI
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY not found in .env file!")
genai.configure(api_key=api_key)

# Initialize the application
app = FastAPI(title="WanderLens Engine", description="AI and Algorithmic Routing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # CHANGED FROM localhost
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    travelers: int
    vibe: str

# --- REAL-TIME WEATHER SCOUT ---
def get_weather_context(destination: str) -> str:
    """Fetches real-time weather and generates a strict AI rule if necessary."""
    print(f"Checking live weather radar for {destination}...")
    try:
        # 1. Convert city name to coordinates (Free Geocoding)
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={destination}&count=1&format=json"
        geo_res = requests.get(geo_url).json()
        
        if "results" not in geo_res:
            return "" # Could not find city, skip weather injection
            
        lat = geo_res["results"][0]["latitude"]
        lng = geo_res["results"][0]["longitude"]
        
        # 2. Get current weather at those coordinates
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current_weather=true"
        weather_res = requests.get(weather_url).json()
        
        weather_code = weather_res["current_weather"]["weathercode"]
        temp_c = weather_res["current_weather"]["temperature"]
        
        # 3. Translate WMO codes into human conditions
        condition = "Clear"
        if weather_code in [45, 48]: condition = "Foggy"
        elif weather_code in [51, 53, 55, 61, 63, 65, 80, 81, 82]: condition = "Raining"
        elif weather_code in [71, 73, 75, 85, 86]: condition = "Snowing"
        elif weather_code in [95, 96, 99]: condition = "Thunderstorms"

        print(f"Weather Check: {temp_c}°C, {condition}")

        # 4. Create the AI Injection Rule
        if condition in ["Raining", "Snowing", "Thunderstorms"]:
            return f"CRITICAL WEATHER ALERT: It is currently {temp_c}°C and {condition} in {destination}. You MUST heavily prioritize indoor activities (museums, indoor markets, theaters, cafes). Avoid outdoor walking tours."
        elif temp_c > 30:
            return f"CRITICAL WEATHER ALERT: It is currently {temp_c}°C (Extremely Hot) in {destination}. You MUST include air-conditioned activities and recommend outdoor activities only during early morning or late evening."
        
        return f"Current Weather: {temp_c}°C and {condition}. The weather is fine, balance indoor and outdoor activities normally."
        
    except Exception as e:
        print(f"Weather radar failed: {e}")
        return ""

# --- THE KNAPSACK OPTIMIZATION ENGINE ---
def optimize_budget(raw_locations, max_budget, max_hours_per_day):
    solver = knapsack_solver.KnapsackSolver(
        knapsack_solver.SolverType.KNAPSACK_MULTIDIMENSION_BRANCH_AND_BOUND_SOLVER,
        "BudgetOptimizer",
    )

    values, costs, durations = [], [], []
    for loc in raw_locations:
        values.append(int(loc.get("fun_rating", 5) * 10)) 
        costs.append(int(loc.get("cost_usd", 0) * 10))
        durations.append(int(loc.get("duration_hours", 2) * 10))

    capacities = [int(max_budget * 10), int(max_hours_per_day * 10)]
    weights = [costs, durations]

    solver.init(values, weights, capacities)
    solver.solve()

    optimized_locations = []
    total_cost = 0
    
    for i in range(len(values)):
        if solver.best_solution_contains(i):
            optimized_locations.append(raw_locations[i])
            total_cost += raw_locations[i].get("cost_usd", 0)
            
    return optimized_locations, total_cost


# --- THE MAIN GENERATION PIPELINE ---
@app.post("/api/generate")
async def generate_itinerary(request: TripRequest):
    print(f"\n--- NEW REQUEST TRIGGERED ---")
    print(f"Destination: {request.destination} | Budget: ${request.budget}")
    
    # 1. Fetch Real-Time Constraints
    weather_injection = get_weather_context(request.destination)

    locations_needed = request.days * 5 
    loose_budget = request.budget * 1.5 

    # 2. Dynamic Luxury Override
    budget_per_day = request.budget / request.days
    luxury_injection = ""
    if budget_per_day > 300:
        luxury_injection = "WARNING: The user has a massive budget. You MUST include exclusive, luxury, VIP, or highly expensive activities (e.g., Michelin star dining, private yacht tours, premium theater tickets)."

    json_schema = """
    {
      "trip_summary": "Catchy title",
      "potential_locations": [
        {
          "name": "Eiffel Tower",
          "type": "landmark",
          "cost_usd": 30.50,
          "duration_hours": 2.0,
          "fun_rating": 9,
          "coordinates": {"lat": 48.8584, "lng": 2.2945}
        }
      ]
    }
    """

    prompt = f"""
    You are an expert travel AI. Generate a massive pool of exactly {locations_needed} 
    potential activities for a trip to {request.destination}.
    The overall vibe should be: {request.vibe}.
    Assume a loose total budget of ${loose_budget}.
    
    {weather_injection}
    {luxury_injection}
    
    CRITICAL INSTRUCTIONS:
    1. Every location MUST have a "fun_rating" from 1 to 10 (10 being incredible).
    2. Ensure accurate latitude/longitude coordinates so we can map them.
    3. Return ONLY a JSON object matching this schema: {json_schema}
    """

    try:
        # 3. AI Generation
        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config={"response_mime_type": "application/json"}
        )
        response = model.generate_content(prompt)
        
        # --- AI DATA SANITIZER ---
        raw_text = response.text.strip()
        
        # 1. Strip Markdown backticks if Gemini includes them
        if raw_text.startswith("```"):
            raw_text = raw_text.strip("`").replace("json\n", "", 1).strip()
            
        # 2. Safely parse the JSON
        try:
            ai_data = json.loads(raw_text)
        except json.JSONDecodeError as e:
            print(f"AI Format Error: {e}")
            print(f"Raw Output: {raw_text}")
            raise HTTPException(
                status_code=500, 
                detail="The AI formatting hiccuped. Please click Generate again!"
            )
        raw_pool = ai_data.get("potential_locations", [])
        
        print(f"AI generated {len(raw_pool)} potential locations. Filtering via Knapsack...")

        # 4. Mathematical Optimization (Knapsack)
        max_total_hours = request.days * 8 
        optimized_pool, final_cost = optimize_budget(
            raw_pool, 
            max_budget=request.budget, 
            max_hours_per_day=max_total_hours
        )
        
        print(f"Knapsack complete. Trimmed to {len(optimized_pool)} locations. Final cost: ${final_cost}")

        # 5. Repackaging for Frontend
        daily_itinerary = []
        locations_per_day = len(optimized_pool) // request.days
        if locations_per_day == 0: locations_per_day = 1 

        for day in range(1, request.days + 1):
            start_idx = (day - 1) * locations_per_day
            end_idx = start_idx + locations_per_day
            
            if day == request.days: 
                day_locs = optimized_pool[start_idx:]
            else:
                day_locs = optimized_pool[start_idx:end_idx]
                
            daily_itinerary.append({
                "day": day,
                "locations": day_locs
            })

        final_payload = {
            "trip_summary": ai_data.get("trip_summary", "Optimized Journey"),
            "total_estimated_cost": round(final_cost, 2),
            "itinerary": daily_itinerary
        }

        return {
            "status": "success",
            "message": "AI pool generated and Knapsack optimized successfully.",
            "data": final_payload
        }

    except Exception as e:
        print(f"Engine Failure: {e}")
        raise HTTPException(status_code=500, detail="The AI/Algorithmic engine encountered a fatal error.")