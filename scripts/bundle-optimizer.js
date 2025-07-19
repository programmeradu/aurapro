#!/usr/bin/env node
/**
 * 📦 Bundle Size Optimizer for AURA Command Center
 * Analyzes and optimizes bundle size by removing unused dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BundleOptimizer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.packageJsonPath = path.join(this.projectRoot, 'package.json');
    this.packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    this.srcDir = path.join(this.projectRoot, 'src');
    
    this.unusedDependencies = [];
    this.redundantDependencies = [];
    this.optimizationRecommendations = [];
  }

  // Analyze import usage across the codebase
  analyzeImportUsage() {
    console.log('🔍 Analyzing import usage...');
    
    const allFiles = this.getAllTsxFiles(this.srcDir);
    const importMap = new Map();
    
    allFiles.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf8');
      const imports = this.extractImports(content);
      
      imports.forEach(importName => {
        if (!importMap.has(importName)) {
          importMap.set(importName, []);
        }
        importMap.get(importName).push(filePath);
      });
    });
    
    return importMap;
  }

  // Get all TypeScript/React files
  getAllTsxFiles(dir) {
    const files = [];
    
    const traverse = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          traverse(fullPath);
        } else if (item.match(/\.(tsx?|jsx?)$/)) {
          files.push(fullPath);
        }
      });
    };
    
    traverse(dir);
    return files;
  }

  // Extract import statements from file content
  extractImports(content) {
    const imports = [];
    
    // Match various import patterns
    const importPatterns = [
      /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    ];
    
    importPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const importPath = match[1];
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          // Extract package name (handle scoped packages)
          const packageName = importPath.startsWith('@') 
            ? importPath.split('/').slice(0, 2).join('/')
            : importPath.split('/')[0];
          imports.push(packageName);
        }
      }
    });
    
    return [...new Set(imports)];
  }

  // Find unused dependencies
  findUnusedDependencies() {
    console.log('🗑️ Finding unused dependencies...');
    
    const importMap = this.analyzeImportUsage();
    const dependencies = Object.keys(this.packageJson.dependencies || {});
    
    dependencies.forEach(dep => {
      if (!importMap.has(dep)) {
        this.unusedDependencies.push(dep);
      }
    });
    
    console.log(`Found ${this.unusedDependencies.length} potentially unused dependencies`);
    return this.unusedDependencies;
  }

  // Find redundant dependencies
  findRedundantDependencies() {
    console.log('🔄 Finding redundant dependencies...');
    
    const redundancyChecks = [
      {
        packages: ['axios', 'fetch'],
        reason: 'Both axios and native fetch - consider using only fetch',
        recommendation: 'Remove axios, use native fetch API'
      },
      {
        packages: ['react-icons', 'lucide-react'],
        reason: 'Multiple icon libraries',
        recommendation: 'Standardize on lucide-react, remove react-icons'
      },
      {
        packages: ['@nextui-org/react', '@heroui/react'],
        reason: 'Conflicting UI libraries',
        recommendation: 'Choose one UI library and remove the other'
      },
      {
        packages: ['react-map-gl', 'mapbox-gl'],
        reason: 'Potential map library redundancy',
        recommendation: 'Verify if both are needed, consider using only mapbox-gl'
      }
    ];
    
    const dependencies = Object.keys(this.packageJson.dependencies || {});
    
    redundancyChecks.forEach(check => {
      const foundPackages = check.packages.filter(pkg => dependencies.includes(pkg));
      if (foundPackages.length > 1) {
        this.redundantDependencies.push({
          packages: foundPackages,
          reason: check.reason,
          recommendation: check.recommendation
        });
      }
    });
    
    return this.redundantDependencies;
  }

  // Generate optimization recommendations
  generateOptimizations() {
    console.log('💡 Generating optimization recommendations...');
    
    // Tree shaking opportunities
    this.optimizationRecommendations.push({
      type: 'tree-shaking',
      title: 'Improve Tree Shaking',
      actions: [
        'Use named imports instead of default imports where possible',
        'Import only specific functions from large libraries',
        'Configure webpack to enable better tree shaking'
      ]
    });
    
    // Code splitting opportunities
    this.optimizationRecommendations.push({
      type: 'code-splitting',
      title: 'Implement Code Splitting',
      actions: [
        'Lazy load dashboard components',
        'Split vendor bundles',
        'Use dynamic imports for heavy components'
      ]
    });
    
    // Bundle analysis
    this.optimizationRecommendations.push({
      type: 'bundle-analysis',
      title: 'Bundle Analysis',
      actions: [
        'Add webpack-bundle-analyzer',
        'Monitor bundle size in CI/CD',
        'Set performance budgets'
      ]
    });
    
    return this.optimizationRecommendations;
  }

  // Create optimized package.json
  createOptimizedPackageJson() {
    console.log('📝 Creating optimized package.json...');
    
    const optimizedPackageJson = { ...this.packageJson };
    
    // Remove unused dependencies
    this.unusedDependencies.forEach(dep => {
      console.log(`  Removing unused dependency: ${dep}`);
      delete optimizedPackageJson.dependencies[dep];
    });
    
    // Handle redundant dependencies
    const dependenciesToRemove = [
      'react-icons', // Keep lucide-react
      // 'axios' // Keep for now, but recommend migration to fetch
    ];
    
    dependenciesToRemove.forEach(dep => {
      if (optimizedPackageJson.dependencies[dep]) {
        console.log(`  Removing redundant dependency: ${dep}`);
        delete optimizedPackageJson.dependencies[dep];
      }
    });
    
    // Add bundle optimization scripts
    optimizedPackageJson.scripts = {
      ...optimizedPackageJson.scripts,
      'analyze': 'cross-env ANALYZE=true next build',
      'bundle-size': 'npx bundlesize',
      'optimize': 'node scripts/bundle-optimizer.js'
    };
    
    // Add bundle size monitoring
    optimizedPackageJson.bundlesize = [
      {
        path: '.next/static/js/*.js',
        maxSize: '500kb'
      },
      {
        path: '.next/static/css/*.css',
        maxSize: '100kb'
      }
    ];
    
    return optimizedPackageJson;
  }

  // Update Next.js config for better optimization
  updateNextConfig() {
    console.log('⚙️ Updating Next.js configuration...');
    
    const nextConfigPath = path.join(this.projectRoot, 'next.config.js');
    const optimizedConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@nextui-org/react', 'recharts'],
  },
  transpilePackages: ['@nextui-org/react', '@nextui-org/theme'],
  
  // Bundle optimization
  webpack: (config, { isServer }) => {
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\\\/]node_modules[\\\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }
    
    // Resolve fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    return config;
  },
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // TypeScript and ESLint
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;`;
    
    fs.writeFileSync(nextConfigPath, optimizedConfig);
    console.log('✅ Updated next.config.js');
  }

  // Generate optimization report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      analysis: {
        totalDependencies: Object.keys(this.packageJson.dependencies || {}).length,
        unusedDependencies: this.unusedDependencies,
        redundantDependencies: this.redundantDependencies,
        optimizationRecommendations: this.optimizationRecommendations
      },
      savings: {
        removedDependencies: this.unusedDependencies.length,
        estimatedSizeReduction: `${this.unusedDependencies.length * 50}KB` // Rough estimate
      }
    };
    
    const reportPath = path.join(this.projectRoot, 'bundle-optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Bundle Optimization Report:');
    console.log(`  Total dependencies: ${report.analysis.totalDependencies}`);
    console.log(`  Unused dependencies: ${report.analysis.unusedDependencies.length}`);
    console.log(`  Redundant dependencies: ${report.analysis.redundantDependencies.length}`);
    console.log(`  Estimated size reduction: ${report.savings.estimatedSizeReduction}`);
    console.log(`\n📄 Full report saved to: ${reportPath}`);
    
    return report;
  }

  // Run complete optimization
  async optimize() {
    console.log('🚀 Starting Bundle Optimization...');
    console.log('=' * 50);
    
    try {
      // Analysis phase
      this.findUnusedDependencies();
      this.findRedundantDependencies();
      this.generateOptimizations();
      
      // Optimization phase
      const optimizedPackageJson = this.createOptimizedPackageJson();
      this.updateNextConfig();
      
      // Backup original package.json
      const backupPath = path.join(this.projectRoot, 'package.json.backup');
      fs.writeFileSync(backupPath, JSON.stringify(this.packageJson, null, 2));
      console.log(`📦 Backed up original package.json to ${backupPath}`);
      
      // Write optimized package.json
      fs.writeFileSync(this.packageJsonPath, JSON.stringify(optimizedPackageJson, null, 2));
      console.log('✅ Updated package.json with optimizations');
      
      // Generate report
      this.generateReport();
      
      console.log('\n🎉 Bundle optimization complete!');
      console.log('Next steps:');
      console.log('1. Run `npm install` to update dependencies');
      console.log('2. Run `npm run build` to test the optimized build');
      console.log('3. Run `npm run analyze` to analyze bundle size');
      
    } catch (error) {
      console.error('❌ Bundle optimization failed:', error);
      throw error;
    }
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new BundleOptimizer();
  optimizer.optimize().catch(console.error);
}

module.exports = BundleOptimizer;
