import pickle
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# Load the necessary data and models from pickle files
with open('new_df.pkl', 'rb') as file:
    new_df = pickle.load(file)

with open('similarity_reduced.pkl', 'rb') as file:
    similarity = pickle.load(file)

with open('cv.pkl', 'rb') as file:
    cv = pickle.load(file)

# Define a Pydantic model for the request body


class RecommendRequest(BaseModel):
    course_name: str

# Define the recommend function


def recommend(course):
    course_index = new_df[new_df['course_name'] == course].index[0]
    distances = similarity[course_index]
    course_list = sorted(list(enumerate(distances)),
                         reverse=True, key=lambda x: x[1])[1:20]
    recommendations = [new_df.iloc[i[0]].course_name for i in course_list]
    return recommendations


# Set up CORS middleware
origins = [
    "http://localhost",
    "http://localhost:3000",
    "https://educational-course-recommendation-system.vercel.app",
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the API endpoint to get all course names


@app.get('/')
def get_course_names():
    course_names = new_df['course_name'].tolist()
    return {"course_names": course_names}

# Define the API endpoint for recommendations


@app.post('/recommend')
def get_recommendations(request: RecommendRequest):
    course_name = request.course_name
    recommendations = recommend(course_name)
    return {"recommendations": recommendations}
