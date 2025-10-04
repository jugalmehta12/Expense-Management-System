from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
import asyncio
import logging
from datetime import datetime, timedelta
import os
from pathlib import Path

# AI Services
from services.categorization_service import CategorizationService
from services.fraud_detection_service import FraudDetectionService
from services.predictive_analytics_service import PredictiveAnalyticsService
from services.receipt_validation_service import ReceiptValidationService
from services.auto_tagging_service import AutoTaggingService
from services.ocr_service import EnhancedOCRService

# Models
from models.expense_models import ExpenseData, CategoryPrediction, FraudAlert, PredictionResult
from models.receipt_models import ReceiptData, ValidationResult, OCRResult

# Middleware
from middleware.auth import verify_api_key
from middleware.rate_limiting import rate_limit
from middleware.logging import request_logger

# Configuration
from config.settings import settings

# Initialize FastAPI app
app = FastAPI(
    title="Expense Management AI Services",
    description="Advanced AI/ML services for intelligent expense management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize AI services
categorization_service = CategorizationService()
fraud_detection_service = FraudDetectionService()
predictive_analytics_service = PredictiveAnalyticsService()
receipt_validation_service = ReceiptValidationService()
auto_tagging_service = AutoTaggingService()
ocr_service = EnhancedOCRService()

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "services": {
            "categorization": "active",
            "fraud_detection": "active",
            "predictive_analytics": "active",
            "receipt_validation": "active",
            "auto_tagging": "active",
            "ocr": "active"
        }
    }

# === EXPENSE CATEGORIZATION ENDPOINTS ===

@app.post("/api/v1/categorize-expense", response_model=CategoryPrediction)
async def categorize_expense(
    expense_data: ExpenseData,
    api_key: str = Depends(verify_api_key)
):
    """
    Predict expense category using ensemble ML models
    
    - **Vendor-based categorization**: Category prediction based on vendor patterns
    - **Amount-based categorization**: Category prediction based on expense amounts
    - **Description NLP**: Natural language processing of expense descriptions
    - **Historical pattern analysis**: Learning from user's expense history
    """
    try:
        result = await categorization_service.predict_category(expense_data)
        logger.info(f"Category prediction completed for expense: {expense_data.description}")
        return result
    except Exception as e:
        logger.error(f"Categorization error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to categorize expense")

@app.post("/api/v1/batch-categorize", response_model=List[CategoryPrediction])
async def batch_categorize_expenses(
    expenses: List[ExpenseData],
    api_key: str = Depends(verify_api_key)
):
    """
    Batch categorization for multiple expenses
    """
    try:
        results = await categorization_service.batch_predict(expenses)
        logger.info(f"Batch categorization completed for {len(expenses)} expenses")
        return results
    except Exception as e:
        logger.error(f"Batch categorization error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process batch categorization")

# === FRAUD DETECTION ENDPOINTS ===

@app.post("/api/v1/detect-fraud", response_model=FraudAlert)
async def detect_fraud(
    expense_data: ExpenseData,
    user_history: Optional[List[ExpenseData]] = None,
    api_key: str = Depends(verify_api_key)
):
    """
    Advanced fraud detection using multiple algorithms
    
    - **Pattern recognition**: Unusual spending pattern detection
    - **Duplicate detection**: AI-powered duplicate expense identification
    - **Amount anomaly**: Statistical outlier detection
    - **Behavioral analysis**: User behavior pattern analysis
    """
    try:
        result = await fraud_detection_service.analyze_expense(expense_data, user_history)
        logger.info(f"Fraud analysis completed for expense: {expense_data.description}")
        return result
    except Exception as e:
        logger.error(f"Fraud detection error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze expense for fraud")

@app.post("/api/v1/risk-assessment")
async def assess_risk_score(
    expense_data: ExpenseData,
    company_policies: Dict[str, Any],
    api_key: str = Depends(verify_api_key)
):
    """
    Calculate comprehensive risk score for expense
    """
    try:
        risk_score = await fraud_detection_service.calculate_risk_score(
            expense_data, company_policies
        )
        return {"risk_score": risk_score, "timestamp": datetime.utcnow()}
    except Exception as e:
        logger.error(f"Risk assessment error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to assess risk score")

# === PREDICTIVE ANALYTICS ENDPOINTS ===

@app.post("/api/v1/predict-budget", response_model=PredictionResult)
async def predict_budget(
    historical_data: List[ExpenseData],
    prediction_months: int = Field(default=3, ge=1, le=12),
    api_key: str = Depends(verify_api_key)
):
    """
    ML-based budget forecasting
    
    - **Seasonal trend analysis**: Identifies spending patterns throughout the year
    - **Growth prediction**: Predicts budget requirements based on historical trends
    - **Category-wise forecasting**: Detailed predictions for each expense category
    """
    try:
        result = await predictive_analytics_service.predict_budget(
            historical_data, prediction_months
        )
        logger.info(f"Budget prediction completed for {prediction_months} months")
        return result
    except Exception as e:
        logger.error(f"Budget prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to predict budget")

@app.post("/api/v1/analyze-trends")
async def analyze_spending_trends(
    expenses: List[ExpenseData],
    analysis_type: str = Field(default="monthly", regex="^(weekly|monthly|quarterly)$"),
    api_key: str = Depends(verify_api_key)
):
    """
    Advanced spending trend analysis
    """
    try:
        trends = await predictive_analytics_service.analyze_trends(expenses, analysis_type)
        return {"trends": trends, "analysis_type": analysis_type}
    except Exception as e:
        logger.error(f"Trend analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze spending trends")

@app.post("/api/v1/predict-approval-time")
async def predict_approval_time(
    expense_data: ExpenseData,
    approval_history: List[Dict[str, Any]],
    api_key: str = Depends(verify_api_key)
):
    """
    Predict expense approval processing time
    """
    try:
        prediction = await predictive_analytics_service.predict_approval_time(
            expense_data, approval_history
        )
        return {
            "estimated_hours": prediction,
            "confidence": 0.85,
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Approval time prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to predict approval time")

# === RECEIPT VALIDATION ENDPOINTS ===

@app.post("/api/v1/validate-receipt", response_model=ValidationResult)
async def validate_receipt(
    file: UploadFile = File(...),
    api_key: str = Depends(verify_api_key)
):
    """
    Deep learning receipt authenticity validation
    
    - **Image quality analysis**: Checks for image manipulation
    - **Text consistency**: Validates text alignment and formatting
    - **Structural analysis**: Verifies receipt structure and layout
    - **Anti-fraud detection**: Identifies potentially fake receipts
    """
    try:
        # Save uploaded file temporarily
        file_path = f"/tmp/{file.filename}"
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        result = await receipt_validation_service.validate_receipt(file_path)
        
        # Clean up temporary file
        os.remove(file_path)
        
        logger.info(f"Receipt validation completed for file: {file.filename}")
        return result
    except Exception as e:
        logger.error(f"Receipt validation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to validate receipt")

@app.post("/api/v1/enhanced-ocr", response_model=OCRResult)
async def enhanced_ocr_processing(
    file: UploadFile = File(...),
    enhance_image: bool = True,
    api_key: str = Depends(verify_api_key)
):
    """
    Enhanced OCR with image preprocessing and AI validation
    
    - **Image enhancement**: Automatic contrast, brightness, and noise reduction
    - **Multi-engine OCR**: Combines multiple OCR engines for better accuracy
    - **Field extraction**: Intelligent extraction of key fields (amount, date, vendor)
    - **Confidence scoring**: Provides confidence scores for extracted data
    """
    try:
        file_path = f"/tmp/{file.filename}"
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        result = await ocr_service.process_receipt(file_path, enhance_image)
        
        # Clean up temporary file
        os.remove(file_path)
        
        logger.info(f"Enhanced OCR completed for file: {file.filename}")
        return result
    except Exception as e:
        logger.error(f"Enhanced OCR error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process OCR")

# === AUTO-TAGGING ENDPOINTS ===

@app.post("/api/v1/auto-tag")
async def auto_tag_expense(
    expense_data: ExpenseData,
    api_key: str = Depends(verify_api_key)
):
    """
    Intelligent auto-tagging with metadata extraction
    
    - **Semantic tagging**: Context-aware tag generation
    - **Project association**: Automatic project/client linking
    - **Purpose classification**: Business purpose categorization
    - **Location extraction**: Geographic information extraction
    """
    try:
        tags = await auto_tagging_service.generate_tags(expense_data)
        metadata = await auto_tagging_service.extract_metadata(expense_data)
        
        return {
            "tags": tags,
            "metadata": metadata,
            "confidence": 0.9,
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Auto-tagging error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate tags")

# === ANALYTICS ENDPOINTS ===

@app.get("/api/v1/model-performance")
async def get_model_performance(api_key: str = Depends(verify_api_key)):
    """
    Get AI model performance metrics
    """
    try:
        metrics = {
            "categorization_accuracy": await categorization_service.get_accuracy(),
            "fraud_detection_precision": await fraud_detection_service.get_precision(),
            "prediction_mae": await predictive_analytics_service.get_mae(),
            "ocr_accuracy": await ocr_service.get_accuracy(),
            "last_updated": datetime.utcnow()
        }
        return metrics
    except Exception as e:
        logger.error(f"Performance metrics error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve model performance")

@app.post("/api/v1/retrain-models")
async def retrain_models(
    training_data: Dict[str, List[Dict[str, Any]]],
    api_key: str = Depends(verify_api_key)
):
    """
    Trigger model retraining with new data
    """
    try:
        # Background task for model retraining
        asyncio.create_task(retrain_models_background(training_data))
        
        return {
            "status": "retraining_started",
            "estimated_completion": datetime.utcnow() + timedelta(hours=2),
            "message": "Model retraining initiated successfully"
        }
    except Exception as e:
        logger.error(f"Model retraining error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initiate model retraining")

async def retrain_models_background(training_data: Dict[str, List[Dict[str, Any]]]):
    """Background task for model retraining"""
    try:
        logger.info("Starting model retraining process...")
        
        # Retrain categorization models
        if "categorization" in training_data:
            await categorization_service.retrain(training_data["categorization"])
        
        # Retrain fraud detection models
        if "fraud_detection" in training_data:
            await fraud_detection_service.retrain(training_data["fraud_detection"])
        
        # Retrain predictive models
        if "predictions" in training_data:
            await predictive_analytics_service.retrain(training_data["predictions"])
        
        logger.info("Model retraining completed successfully")
    except Exception as e:
        logger.error(f"Background retraining error: {str(e)}")

# === WEBSOCKET ENDPOINTS ===

@app.websocket("/ws/real-time-analysis")
async def websocket_real_time_analysis(websocket):
    """
    Real-time expense analysis via WebSocket
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            expense_data = ExpenseData(**data)
            
            # Perform real-time analysis
            category = await categorization_service.predict_category(expense_data)
            fraud_alert = await fraud_detection_service.analyze_expense(expense_data)
            
            # Send results back
            await websocket.send_json({
                "category": category.dict(),
                "fraud_alert": fraud_alert.dict(),
                "timestamp": datetime.utcnow().isoformat()
            })
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.close()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )