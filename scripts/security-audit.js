#!/usr/bin/env node

/**
 * Security Audit Script for Superchain Drummer
 * Checks for common security issues and exposed secrets
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ANSI color codes for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

class SecurityAuditor {
    constructor() {
        this.issues = [];
        this.warnings = [];
        this.passed = [];
        this.scannedFiles = 0;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        switch (type) {
            case 'error':
                console.log(`${colors.red}[ERROR]${colors.reset} ${timestamp}: ${message}`);
                break;
            case 'warning':
                console.log(`${colors.yellow}[WARN]${colors.reset} ${timestamp}: ${message}`);
                break;
            case 'success':
                console.log(`${colors.green}[PASS]${colors.reset} ${timestamp}: ${message}`);
                break;
            default:
                console.log(`${colors.blue}[INFO]${colors.reset} ${timestamp}: ${message}`);
        }
    }

    // Check if a string looks like a private key
    isPrivateKey(str) {
        // Ethereum private key pattern (64 hex characters, optionally with 0x prefix)
        const privateKeyPattern = /^(0x)?[0-9a-fA-F]{64}$/;
        return privateKeyPattern.test(str.trim());
    }

    // Check if a string looks like an API key
    isApiKey(str) {
        // Common API key patterns
        const apiKeyPatterns = [
            /^[A-Za-z0-9]{32,}$/, // Generic API key
            /^[A-Za-z0-9]{20,}$/, // Shorter API key
            /^[A-Za-z0-9_-]{20,}$/ // API key with special chars
        ];
        return apiKeyPatterns.some(pattern => pattern.test(str.trim()));
    }

    // Check if a string looks like a mnemonic phrase
    isMnemonic(str) {
        const words = str.trim().split(/\s+/);
        return words.length >= 12 && words.length <= 24;
    }

    // Check if a string looks like a contract address
    isContractAddress(str) {
        return /^0x[a-fA-F0-9]{40}$/.test(str.trim());
    }

    // Scan a file for sensitive information
    scanFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            lines.forEach((line, lineNumber) => {
                const trimmedLine = line.trim();
                
                // Skip comments and empty lines
                if (trimmedLine.startsWith('//') || trimmedLine.startsWith('#') || trimmedLine === '') {
                    return;
                }

                // Check for private keys
                if (this.isPrivateKey(trimmedLine)) {
                    this.issues.push({
                        type: 'PRIVATE_KEY',
                        file: filePath,
                        line: lineNumber + 1,
                        severity: 'CRITICAL',
                        message: 'Private key found in code'
                    });
                }

                // Check for API keys
                if (this.isApiKey(trimmedLine)) {
                    this.warnings.push({
                        type: 'API_KEY',
                        file: filePath,
                        line: lineNumber + 1,
                        severity: 'HIGH',
                        message: 'Potential API key found'
                    });
                }

                // Check for hardcoded secrets
                const secretPatterns = [
                    /private_key/i,
                    /secret_key/i,
                    /api_key/i,
                    /access_token/i,
                    /password/i
                ];

                secretPatterns.forEach(pattern => {
                    if (pattern.test(trimmedLine) && !trimmedLine.includes('process.env')) {
                        this.warnings.push({
                            type: 'HARDCODED_SECRET',
                            file: filePath,
                            line: lineNumber + 1,
                            severity: 'MEDIUM',
                            message: 'Potential hardcoded secret'
                        });
                    }
                });
            });

            this.scannedFiles++;
        } catch (error) {
            this.log(`Error scanning file ${filePath}: ${error.message}`, 'error');
        }
    }

    // Recursively scan directory
    scanDirectory(dirPath, excludePatterns = []) {
        const items = fs.readdirSync(dirPath);
        
        items.forEach(item => {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);
            
            // Skip excluded patterns
            if (excludePatterns.some(pattern => fullPath.includes(pattern))) {
                return;
            }

            if (stat.isDirectory()) {
                this.scanDirectory(fullPath, excludePatterns);
            } else if (stat.isFile()) {
                // Only scan certain file types
                const ext = path.extname(fullPath);
                const scanExtensions = ['.js', '.ts', '.sol', '.json', '.md', '.txt', '.env'];
                
                if (scanExtensions.includes(ext) || item.includes('package')) {
                    this.scanFile(fullPath);
                }
            }
        });
    }

    // Check .gitignore
    checkGitignore() {
        try {
            const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
            const requiredEntries = [
                '.env',
                'node_modules',
                'cache',
                'artifacts',
                'deployments'
            ];

            requiredEntries.forEach(entry => {
                if (gitignoreContent.includes(entry)) {
                    this.passed.push(`✅ .gitignore includes ${entry}`);
                } else {
                    this.warnings.push({
                        type: 'GITIGNORE',
                        file: '.gitignore',
                        line: 0,
                        severity: 'MEDIUM',
                        message: `.gitignore missing ${entry}`
                    });
                }
            });
        } catch (error) {
            this.issues.push({
                type: 'GITIGNORE',
                file: '.gitignore',
                line: 0,
                severity: 'HIGH',
                message: '.gitignore file not found'
            });
        }
    }

    // Check for .env file
    checkEnvFile() {
        if (fs.existsSync('.env')) {
            this.passed.push('✅ .env file exists');
            
            // Check if .env is in .gitignore
            try {
                const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
                if (gitignoreContent.includes('.env')) {
                    this.passed.push('✅ .env file is in .gitignore');
                } else {
                    this.issues.push({
                        type: 'ENV_EXPOSED',
                        file: '.gitignore',
                        line: 0,
                        severity: 'CRITICAL',
                        message: '.env file not in .gitignore'
                    });
                }
            } catch (error) {
                this.issues.push({
                    type: 'ENV_EXPOSED',
                    file: '.gitignore',
                    line: 0,
                    severity: 'CRITICAL',
                    message: 'Cannot verify .env is in .gitignore'
                });
            }
        } else {
            this.warnings.push({
                type: 'ENV_MISSING',
                file: '.env',
                line: 0,
                severity: 'LOW',
                message: '.env file not found (create one for production)'
            });
        }
    }

    // Check package.json for security issues
    checkPackageJson() {
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            
            // Check for scripts that might expose secrets
            if (packageJson.scripts) {
                Object.entries(packageJson.scripts).forEach(([name, script]) => {
                    if (typeof script === 'string' && script.includes('private')) {
                        this.warnings.push({
                            type: 'SCRIPT_SECRET',
                            file: 'package.json',
                            line: 0,
                            severity: 'LOW',
                            message: `Script "${name}" might contain sensitive info`
                        });
                    }
                });
            }

            this.passed.push('✅ package.json security check passed');
        } catch (error) {
            this.log(`Error checking package.json: ${error.message}`, 'error');
        }
    }

    // Run npm audit
    async runNpmAudit() {
        return new Promise((resolve) => {
            const { exec } = require('child_process');
            exec('npm audit --json', (error, stdout, stderr) => {
                if (error) {
                    this.log('npm audit not available or failed', 'warning');
                    resolve();
                    return;
                }

                try {
                    const auditResult = JSON.parse(stdout);
                    if (auditResult.vulnerabilities && Object.keys(auditResult.vulnerabilities).length > 0) {
                        this.warnings.push({
                            type: 'NPM_VULNERABILITIES',
                            file: 'package.json',
                            line: 0,
                            severity: 'MEDIUM',
                            message: 'npm audit found vulnerabilities'
                        });
                    } else {
                        this.passed.push('✅ npm audit passed');
                    }
                } catch (parseError) {
                    this.log('Error parsing npm audit output', 'warning');
                }
                resolve();
            });
        });
    }

    // Generate report
    generateReport() {
        console.log(`\n${colors.bold}🔒 Security Audit Report${colors.reset}`);
        console.log('='.repeat(50));
        
        console.log(`\n${colors.bold}📊 Summary:${colors.reset}`);
        console.log(`Files scanned: ${this.scannedFiles}`);
        console.log(`Critical issues: ${this.issues.filter(i => i.severity === 'CRITICAL').length}`);
        console.log(`High warnings: ${this.warnings.filter(w => w.severity === 'HIGH').length}`);
        console.log(`Medium warnings: ${this.warnings.filter(w => w.severity === 'MEDIUM').length}`);
        console.log(`Low warnings: ${this.warnings.filter(w => w.severity === 'LOW').length}`);
        console.log(`Passed checks: ${this.passed.length}`);

        if (this.issues.length > 0) {
            console.log(`\n${colors.red}${colors.bold}🚨 CRITICAL ISSUES:${colors.reset}`);
            this.issues.forEach(issue => {
                console.log(`${colors.red}• ${issue.type} in ${issue.file}:${issue.line} - ${issue.message}${colors.reset}`);
            });
        }

        if (this.warnings.length > 0) {
            console.log(`\n${colors.yellow}${colors.bold}⚠️ WARNINGS:${colors.reset}`);
            this.warnings.forEach(warning => {
                const color = warning.severity === 'HIGH' ? colors.red : colors.yellow;
                console.log(`${color}• ${warning.type} in ${warning.file}:${warning.line} - ${warning.message}${colors.reset}`);
            });
        }

        if (this.passed.length > 0) {
            console.log(`\n${colors.green}${colors.bold}✅ PASSED CHECKS:${colors.reset}`);
            this.passed.forEach(pass => {
                console.log(`${colors.green}${pass}${colors.reset}`);
            });
        }

        // Overall assessment
        const criticalIssues = this.issues.filter(i => i.severity === 'CRITICAL').length;
        const highWarnings = this.warnings.filter(w => w.severity === 'HIGH').length;

        console.log(`\n${colors.bold}🎯 Overall Assessment:${colors.reset}`);
        if (criticalIssues > 0) {
            console.log(`${colors.red}${colors.bold}❌ CRITICAL: Fix critical issues before deployment!${colors.reset}`);
        } else if (highWarnings > 0) {
            console.log(`${colors.yellow}${colors.bold}⚠️ WARNING: Review high-priority warnings${colors.reset}`);
        } else {
            console.log(`${colors.green}${colors.bold}✅ SECURE: No critical security issues found${colors.reset}`);
        }

        return {
            criticalIssues,
            highWarnings,
            totalIssues: this.issues.length + this.warnings.length
        };
    }

    // Run full security audit
    async run() {
        console.log(`${colors.bold}🔒 Starting Security Audit...${colors.reset}\n`);

        // Check basic security files
        this.checkGitignore();
        this.checkEnvFile();
        this.checkPackageJson();

        // Scan code for secrets
        const excludePatterns = ['node_modules', '.git', 'cache', 'artifacts', 'deployments'];
        this.scanDirectory('.', excludePatterns);

        // Run npm audit
        await this.runNpmAudit();

        // Generate report
        const result = this.generateReport();

        return result;
    }
}

// Run audit if called directly
if (require.main === module) {
    const auditor = new SecurityAuditor();
    auditor.run().then(result => {
        process.exit(result.criticalIssues > 0 ? 1 : 0);
    }).catch(error => {
        console.error('Audit failed:', error);
        process.exit(1);
    });
}

module.exports = SecurityAuditor; 