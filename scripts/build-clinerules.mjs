import fs from 'node:fs'
import path from 'node:path'

/**
 * Script de copie automatique des règles Cline depuis prompts vers .clinerules
 * Ajoute automatiquement l'indexation numérique pour les fichiers .rules.md
 */

const SOURCE_DIR = 'prompts'
const TARGET_DIR = '.clinerules'

// Table de correspondance : source → destination avec index
// Seules les règles générales sont copiées dans .clinerules
const FILE_MAPPINGS = [
  {
    source: 'languages/json/json.rules.md',
    target: '01-json.rules.md',
    index: 1,
  },
  {
    source: 'intellij.rules.md',
    target: '02-intellij.rules.md',
    index: 2,
  },
  {
    source: 'doc-update.rules.md',
    target: '03-doc-update.rules.md',
    index: 3,
  },
  {
    source: 'languages/markdown/markdown.rules.md',
    target: '04-markdown.rules.md',
    index: 4,
  },
  {
    source: 'languages/javascript/npm.rules.md',
    target: '05-npm.rules.md',
    index: 5,
  },
  {
    source: 'languages/javascript/qa.rules.md',
    target: '06-qa.rules.md',
    index: 6,
  },
  {
    source: 'languages/javascript/typescript.rules.md',
    target: '07-typescript.rules.md',
    index: 7,
  },
]

// Correspondances pour les workflows (pas d'indexation, copie directe)
const WORKFLOW_MAPPINGS = [
  {
    source: 'usecases/products-to-offers/workflows',
    target: 'workflows',
  },
  {
    source: 'languages/javascript/workflows',
    target: 'workflows',
  },
]

/**
 * Crée un répertoire de manière récursive s'il n'existe pas
 */
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    console.log(`✓ Répertoire créé: ${dirPath}`)
  }
}

/**
 * Copie un fichier avec gestion d'erreurs
 */
const copyFile = (sourcePath, targetPath) => {
  try {
    if (!fs.existsSync(sourcePath)) {
      console.warn(`⚠️  Fichier source non trouvé: ${sourcePath}`)
      return false
    }

    // S'assurer que le répertoire de destination existe
    const targetDir = path.dirname(targetPath)
    ensureDirectoryExists(targetDir)

    // Copier le fichier
    fs.copyFileSync(sourcePath, targetPath)
    console.log(`✓ Copié: ${sourcePath} → ${targetPath}`)
    return true
  } catch (error) {
    console.error(`❌ Erreur lors de la copie de ${sourcePath}:`, error.message)
    return false
  }
}

/**
 * Copie tous les fichiers d'un répertoire vers un autre avec gestion de préfixes
 */
const copyDirectory = (sourceDir, targetDir, prefix = null) => {
  if (!fs.existsSync(sourceDir)) {
    console.warn(`⚠️  Répertoire source non trouvé: ${sourceDir}`)
    return 0
  }

  let copiedCount = 0
  const files = fs.readdirSync(sourceDir)

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file)

    // Ajouter le préfixe au nom de fichier si spécifié
    const targetFileName = prefix ? `${prefix}-${file}` : file
    const targetPath = path.join(targetDir, targetFileName)

    if (fs.statSync(sourcePath).isDirectory()) {
      // Copie récursive des sous-répertoires
      copiedCount += copyDirectory(sourcePath, targetDir, prefix)
    } else {
      if (copyFile(sourcePath, targetPath)) {
        copiedCount++
      }
    }
  }

  return copiedCount
}

/**
 * Nettoie le répertoire de destination
 */
const cleanTargetDirectory = () => {
  if (fs.existsSync(TARGET_DIR)) {
    fs.rmSync(TARGET_DIR, { recursive: true, force: true })
    console.log(`✓ Répertoire nettoyé: ${TARGET_DIR}`)
  }
  ensureDirectoryExists(TARGET_DIR)
}

/**
 * Fonction principale
 */
const main = () => {
  console.log('🚀 Démarrage de la copie des règles Cline...\n')

  // Vérifier l'existence du répertoire source
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Répertoire source non trouvé: ${SOURCE_DIR}`)
    process.exit(1)
  }

  // Nettoyer et recréer le répertoire de destination
  cleanTargetDirectory()

  let totalCopied = 0
  let totalErrors = 0

  console.log('📋 Copie des fichiers de règles...')
  // Copier les fichiers de règles avec indexation
  for (const mapping of FILE_MAPPINGS) {
    const sourcePath = path.join(SOURCE_DIR, mapping.source)
    const targetPath = path.join(TARGET_DIR, mapping.target)

    if (copyFile(sourcePath, targetPath)) {
      totalCopied++
    } else {
      totalErrors++
    }
  }

  console.log('\n🔄 Copie des workflows...')
  // Copier les workflows (avec préfixage si spécifié)
  for (const mapping of WORKFLOW_MAPPINGS) {
    const sourceDir = path.join(SOURCE_DIR, mapping.source)
    const targetDir = path.join(TARGET_DIR, mapping.target)

    if (fs.existsSync(sourceDir)) {
      const copiedInDir = copyDirectory(
        sourceDir,
        targetDir,
        mapping.prefix || null,
      )
      totalCopied += copiedInDir
      console.log(
        `  ✓ ${copiedInDir} fichier(s) copiés depuis ${mapping.source}`,
      )
    }
  }

  // Résumé
  console.log('\n📊 Résumé:')
  console.log(`  ✅ Fichiers copiés avec succès: ${totalCopied}`)
  if (totalErrors > 0) {
    console.log(`  ❌ Erreurs: ${totalErrors}`)
  }

  console.log(`\n🎉 Copie terminée! Répertoire de destination: ${TARGET_DIR}`)

  if (totalErrors > 0) {
    process.exit(1)
  }
}

// Exécution si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main }
