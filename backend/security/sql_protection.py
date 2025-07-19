"""
🛡️ SQL Injection Protection
Advanced SQL injection prevention and database security
"""

import re
import logging
import sqlparse
from typing import Any, Dict, List, Optional, Union
from sqlalchemy import text, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from contextlib import contextmanager
import hashlib
import time

logger = logging.getLogger(__name__)

class SQLInjectionDetector:
    """Advanced SQL injection detection and prevention"""
    
    def __init__(self):
        # SQL injection patterns (comprehensive list)
        self.injection_patterns = [
            # Basic SQL injection patterns
            r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)",
            r"(--|#|/\*|\*/)",
            r"(\b(OR|AND)\s+\d+\s*=\s*\d+)",
            r"(\b(OR|AND)\s+['\"]?\w+['\"]?\s*=\s*['\"]?\w+['\"]?)",
            
            # Advanced patterns
            r"(UNION\s+(ALL\s+)?SELECT)",
            r"(INSERT\s+INTO)",
            r"(DROP\s+(TABLE|DATABASE|SCHEMA))",
            r"(EXEC\s*\()",
            r"(SCRIPT\s*>)",
            r"(INFORMATION_SCHEMA)",
            r"(LOAD_FILE\s*\()",
            r"(INTO\s+OUTFILE)",
            r"(BENCHMARK\s*\()",
            r"(SLEEP\s*\()",
            r"(WAITFOR\s+DELAY)",
            
            # Boolean-based blind SQL injection
            r"(\b(OR|AND)\s+\d+\s*[<>=!]+\s*\d+)",
            r"(\b(OR|AND)\s+['\"]?\w+['\"]?\s*(LIKE|REGEXP|RLIKE)\s*['\"])",
            
            # Time-based blind SQL injection
            r"(IF\s*\(\s*\d+\s*=\s*\d+\s*,\s*SLEEP\s*\(\s*\d+\s*\)\s*,\s*\d+\s*\))",
            r"(CASE\s+WHEN\s+\d+\s*=\s*\d+\s+THEN\s+SLEEP\s*\(\s*\d+\s*\))",
            
            # Error-based SQL injection
            r"(EXTRACTVALUE\s*\()",
            r"(UPDATEXML\s*\()",
            r"(EXP\s*\(\s*~\s*\()",
            
            # Stacked queries
            r"(;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER))",
            
            # Function calls that could be dangerous
            r"(CHAR\s*\(\s*\d+)",
            r"(ASCII\s*\()",
            r"(ORD\s*\()",
            r"(HEX\s*\()",
            r"(UNHEX\s*\()",
            r"(CONVERT\s*\()",
            r"(CAST\s*\()",
            
            # Database-specific functions
            r"(@@VERSION|@@SERVERNAME|@@IDENTITY)",
            r"(USER\s*\(\s*\)|CURRENT_USER|SESSION_USER)",
            r"(DATABASE\s*\(\s*\)|SCHEMA\s*\(\s*\))",
            r"(VERSION\s*\(\s*\))",
            
            # Encoded injection attempts
            r"(%27|%22|%2D%2D|%23|%2F%2A|%2A%2F)",  # URL encoded
            r"(\\x27|\\x22|\\x2D|\\x23)",  # Hex encoded
        ]
        
        # Compile patterns for better performance
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.injection_patterns]
        
        # Whitelist of safe SQL functions and keywords
        self.safe_keywords = {
            'SELECT', 'FROM', 'WHERE', 'ORDER', 'BY', 'GROUP', 'HAVING',
            'LIMIT', 'OFFSET', 'AS', 'ASC', 'DESC', 'COUNT', 'SUM', 'AVG',
            'MIN', 'MAX', 'DISTINCT', 'JOIN', 'LEFT', 'RIGHT', 'INNER',
            'OUTER', 'ON', 'USING', 'BETWEEN', 'IN', 'LIKE', 'IS', 'NULL',
            'NOT', 'AND', 'OR'
        }
    
    def detect_sql_injection(self, input_string: str) -> Dict[str, Any]:
        """
        Detect SQL injection attempts in input string
        Returns detection result with details
        """
        if not isinstance(input_string, str):
            return {'is_malicious': False, 'confidence': 0, 'patterns': []}
        
        detected_patterns = []
        confidence_score = 0
        
        # Check against known patterns
        for i, pattern in enumerate(self.compiled_patterns):
            matches = pattern.findall(input_string)
            if matches:
                detected_patterns.append({
                    'pattern_index': i,
                    'pattern': self.injection_patterns[i],
                    'matches': matches,
                    'severity': self._get_pattern_severity(i)
                })
                confidence_score += self._get_pattern_severity(i)
        
        # Additional heuristic checks
        confidence_score += self._heuristic_analysis(input_string)
        
        # Normalize confidence score (0-100)
        confidence_score = min(confidence_score, 100)
        
        is_malicious = confidence_score > 30  # Threshold for malicious detection
        
        if is_malicious:
            logger.warning(f"SQL injection detected: {input_string[:100]}... (confidence: {confidence_score})")
        
        return {
            'is_malicious': is_malicious,
            'confidence': confidence_score,
            'patterns': detected_patterns,
            'input_length': len(input_string)
        }
    
    def _get_pattern_severity(self, pattern_index: int) -> int:
        """Get severity score for detected pattern"""
        # High severity patterns (50 points)
        high_severity = [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]  # DROP, EXEC, UNION, etc.
        
        # Medium severity patterns (30 points)
        medium_severity = [1, 2, 3, 15, 16, 17, 18, 19, 20, 21]  # Comments, boolean injection
        
        # Low severity patterns (15 points)
        low_severity = list(range(22, len(self.injection_patterns)))  # Function calls, etc.
        
        if pattern_index in high_severity:
            return 50
        elif pattern_index in medium_severity:
            return 30
        elif pattern_index in low_severity:
            return 15
        else:
            return 10
    
    def _heuristic_analysis(self, input_string: str) -> int:
        """Additional heuristic analysis for SQL injection detection"""
        score = 0
        input_lower = input_string.lower()
        
        # Check for multiple SQL keywords
        sql_keyword_count = sum(1 for keyword in self.safe_keywords if keyword.lower() in input_lower)
        if sql_keyword_count > 3:
            score += 20
        
        # Check for suspicious character combinations
        suspicious_chars = ["'", '"', ';', '--', '/*', '*/', '#']
        char_count = sum(input_string.count(char) for char in suspicious_chars)
        if char_count > 2:
            score += 15
        
        # Check for encoded characters
        if '%' in input_string and any(encoded in input_string for encoded in ['%27', '%22', '%2D', '%23']):
            score += 25
        
        # Check for function call patterns
        function_pattern = r'\w+\s*\([^)]*\)'
        function_matches = re.findall(function_pattern, input_string)
        if len(function_matches) > 2:
            score += 10
        
        # Check for numeric comparisons (common in blind injection)
        numeric_comparison = r'\d+\s*[<>=!]+\s*\d+'
        if re.search(numeric_comparison, input_string):
            score += 15
        
        return score
    
    def sanitize_sql_input(self, input_string: str) -> str:
        """Sanitize input to prevent SQL injection"""
        if not isinstance(input_string, str):
            return str(input_string)
        
        # Remove dangerous characters
        sanitized = input_string
        
        # Escape single quotes
        sanitized = sanitized.replace("'", "''")
        
        # Remove SQL comments
        sanitized = re.sub(r'--.*$', '', sanitized, flags=re.MULTILINE)
        sanitized = re.sub(r'/\*.*?\*/', '', sanitized, flags=re.DOTALL)
        sanitized = re.sub(r'#.*$', '', sanitized, flags=re.MULTILINE)
        
        # Remove dangerous keywords (if not in safe context)
        dangerous_keywords = ['EXEC', 'EXECUTE', 'DROP', 'DELETE', 'INSERT', 'UPDATE', 'CREATE', 'ALTER']
        for keyword in dangerous_keywords:
            # Only remove if it appears to be a standalone keyword
            pattern = r'\b' + re.escape(keyword) + r'\b'
            sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)
        
        return sanitized.strip()

class SafeQueryBuilder:
    """Safe SQL query builder with parameterized queries"""
    
    def __init__(self, session: Session):
        self.session = session
        self.detector = SQLInjectionDetector()
    
    def safe_select(self, table: str, columns: List[str] = None, where_conditions: Dict[str, Any] = None,
                   order_by: str = None, limit: int = None) -> str:
        """Build safe SELECT query with parameterized inputs"""
        
        # Validate table name
        if not self._is_safe_identifier(table):
            raise ValueError(f"Invalid table name: {table}")
        
        # Build column list
        if columns:
            column_list = ', '.join([col for col in columns if self._is_safe_identifier(col)])
        else:
            column_list = '*'
        
        # Start building query
        query_parts = [f"SELECT {column_list} FROM {table}"]
        params = {}
        
        # Add WHERE conditions
        if where_conditions:
            where_clauses = []
            for i, (column, value) in enumerate(where_conditions.items()):
                if not self._is_safe_identifier(column):
                    continue
                
                param_name = f"param_{i}"
                where_clauses.append(f"{column} = :{param_name}")
                params[param_name] = value
            
            if where_clauses:
                query_parts.append("WHERE " + " AND ".join(where_clauses))
        
        # Add ORDER BY
        if order_by and self._is_safe_identifier(order_by):
            query_parts.append(f"ORDER BY {order_by}")
        
        # Add LIMIT
        if limit and isinstance(limit, int) and limit > 0:
            query_parts.append(f"LIMIT {limit}")
        
        query = " ".join(query_parts)
        return query, params
    
    def safe_insert(self, table: str, data: Dict[str, Any]) -> str:
        """Build safe INSERT query with parameterized inputs"""
        
        if not self._is_safe_identifier(table):
            raise ValueError(f"Invalid table name: {table}")
        
        # Validate column names
        safe_columns = [col for col in data.keys() if self._is_safe_identifier(col)]
        if not safe_columns:
            raise ValueError("No valid columns provided")
        
        # Build query
        columns_str = ', '.join(safe_columns)
        placeholders = ', '.join([f":{col}" for col in safe_columns])
        
        query = f"INSERT INTO {table} ({columns_str}) VALUES ({placeholders})"
        params = {col: data[col] for col in safe_columns}
        
        return query, params
    
    def safe_update(self, table: str, data: Dict[str, Any], where_conditions: Dict[str, Any]) -> str:
        """Build safe UPDATE query with parameterized inputs"""
        
        if not self._is_safe_identifier(table):
            raise ValueError(f"Invalid table name: {table}")
        
        if not where_conditions:
            raise ValueError("WHERE conditions are required for UPDATE queries")
        
        # Validate column names
        safe_columns = [col for col in data.keys() if self._is_safe_identifier(col)]
        if not safe_columns:
            raise ValueError("No valid columns provided")
        
        # Build SET clause
        set_clauses = [f"{col} = :set_{col}" for col in safe_columns]
        set_str = ', '.join(set_clauses)
        
        # Build WHERE clause
        where_clauses = []
        params = {}
        
        # Add SET parameters
        for col in safe_columns:
            params[f"set_{col}"] = data[col]
        
        # Add WHERE parameters
        for i, (column, value) in enumerate(where_conditions.items()):
            if not self._is_safe_identifier(column):
                continue
            
            param_name = f"where_{i}"
            where_clauses.append(f"{column} = :{param_name}")
            params[param_name] = value
        
        if not where_clauses:
            raise ValueError("No valid WHERE conditions provided")
        
        where_str = " AND ".join(where_clauses)
        query = f"UPDATE {table} SET {set_str} WHERE {where_str}"
        
        return query, params
    
    def _is_safe_identifier(self, identifier: str) -> bool:
        """Check if identifier (table/column name) is safe"""
        if not isinstance(identifier, str):
            return False
        
        # Check for SQL injection in identifier
        detection_result = self.detector.detect_sql_injection(identifier)
        if detection_result['is_malicious']:
            return False
        
        # Check identifier format (alphanumeric + underscore only)
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', identifier):
            return False
        
        # Check length
        if len(identifier) > 64:  # MySQL max identifier length
            return False
        
        return True
    
    def execute_safe_query(self, query: str, params: Dict[str, Any] = None):
        """Execute a parameterized query safely"""
        try:
            # Final check for SQL injection in the query
            detection_result = self.detector.detect_sql_injection(query)
            if detection_result['is_malicious']:
                logger.error(f"Malicious query detected: {query}")
                raise ValueError("Malicious query detected")
            
            # Execute with parameters
            result = self.session.execute(text(query), params or {})
            return result
            
        except Exception as e:
            logger.error(f"Query execution error: {e}")
            raise

# SQLAlchemy event listeners for additional protection
@event.listens_for(Engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Monitor SQL queries before execution"""
    
    # Skip internal SQLAlchemy queries
    if context and hasattr(context, 'is_internal') and context.is_internal:
        return
    
    # Log query for monitoring
    logger.debug(f"Executing SQL: {statement[:200]}...")
    
    # Check for potential SQL injection
    detector = SQLInjectionDetector()
    detection_result = detector.detect_sql_injection(statement)
    
    if detection_result['is_malicious']:
        logger.error(f"Potentially malicious SQL detected: {statement}")
        # In production, you might want to block the query
        # raise Exception("Malicious SQL query blocked")

# Context manager for safe database operations
@contextmanager
def safe_db_session(session: Session):
    """Context manager for safe database operations"""
    query_builder = SafeQueryBuilder(session)
    try:
        yield query_builder
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Database operation failed: {e}")
        raise
    finally:
        session.close()

# Utility functions
def validate_sql_query(query: str) -> Dict[str, Any]:
    """Validate SQL query for security issues"""
    detector = SQLInjectionDetector()
    return detector.detect_sql_injection(query)

def sanitize_sql_value(value: Any) -> Any:
    """Sanitize a value for safe SQL usage"""
    if isinstance(value, str):
        detector = SQLInjectionDetector()
        return detector.sanitize_sql_input(value)
    return value

# Export main components
__all__ = [
    'SQLInjectionDetector',
    'SafeQueryBuilder',
    'safe_db_session',
    'validate_sql_query',
    'sanitize_sql_value'
]
