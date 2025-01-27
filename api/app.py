from flask import Flask
from flask_restful import Api, Resource, reqparse, fields, marshal_with
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from gibberish import classify_gibberish
from toxicity import classify_toxicity

app = Flask(__name__)
CORS(app)
api = Api(app)

# Configure SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///text_analysis.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

resource_fields = {
    'text': fields.String,
    'toxicity': fields.String,
    'gibberish': fields.String,
}
# Define the database model
class Analysis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(500), nullable=False)
    toxicity = db.Column(db.Integer, nullable=False)
    gibberish = db.Column(db.String, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# Create the database tables
with app.app_context():
    db.create_all()

class AnalyzeText(Resource):
    def __init__(self):
        self.text_args = reqparse.RequestParser()
        self.text_args.add_argument('text', type=str, required=True, help='No text provided', location='json')
        super(AnalyzeText, self).__init__()

    @marshal_with(resource_fields)
    def post(self):
        args = self.text_args.parse_args()
        text = args['text']
        
        try:
            # Call the external analyze_text function to get the actual analysis
            gibberish_result = classify_gibberish(text)
            toxicity_result = classify_toxicity(text)

            # Extract the relevant values from the dictionaries
            toxicity_label = toxicity_result.get('label', 'unknown')
            toxicity_neutral_prob = toxicity_result.get('neutral_probability', 0.0)
            toxicity_toxic_prob = toxicity_result.get('toxic_probability', 0.0)
            gibberish_label = gibberish_result.get('label', 'unknown')
            gibberish_prob = gibberish_result.get('gibberish_probability', 0.0)
            gibberish_clean_prob = gibberish_result.get('clean_probability', 0.0)
            gibberish = gibberish_prob if gibberish_label == "gibberish" else gibberish_clean_prob


            # Save to the database
            new_analysis = Analysis(
                text=text,
                toxicity= toxicity_toxic_prob,  
                gibberish= gibberish_label + " : " + gibberish,  
            )
            db.session.add(new_analysis)
            db.session.commit()

            # Return the full results as output
            return new_analysis, 200
        
        except Exception as e:
            return {'error': str(e)}, 500

class AnalysisHistory(Resource):
    def get(self):
        try:
            # Fetch the last 10 analysis records from the database
            history = Analysis.query.order_by(Analysis.timestamp.desc()).all()
            return [
                {
                    'text': entry.text,
                    'toxicity': entry.toxicity,
                    'gibberish': entry.gibberish,
                    'timestamp': entry.timestamp.isoformat()
                } for entry in history
            ], 200
        except Exception as e:
            return {'error': str(e)}, 500
        
    def delete(self):
        try:
            db.session.query(Analysis).delete()
            db.session.commit()
            return {'message': 'History deleted successfully'}, 200
        except Exception as e:
            return {'error': str(e)}, 500

# Add resources to the API
api.add_resource(AnalyzeText, '/api/analyze')
api.add_resource(AnalysisHistory, '/api/history')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')

