import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Common
      common: {
        save: 'Save',
        saveChanges: 'Save Changes',
        cancel: 'Cancel',
        delete: 'Delete',
        deleting: 'Deleting...',
        edit: 'Edit',
        create: 'Create',
        update: 'Update',
        loading: 'Loading...',
        saving: 'Saving...',
        search: 'Search',
        filter: 'Filter',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        submit: 'Submit',
        confirm: 'Confirm',
        close: 'Close',
        yes: 'Yes',
        no: 'No',
        all: 'All',
        none: 'None',
        actions: 'Actions',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info',
      },

      // Navigation
      nav: {
        dashboard: 'Dashboard',
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Logout',
        createNewTest: 'Create New Test',
        reports: 'Reports',
        viewTestCases: 'View Test Cases',
        testSuites: 'Test Suites',
        bugs: 'Bugs',
        chat: 'Chat',
        projects: 'Projects',
        users: 'Users',
        analytics: 'Analytics',
      },

      // Auth
      auth: {
        login: 'Login',
        signup: 'Sign Up',
        forgotPassword: 'Forgot Password',
        resetPassword: 'Reset Password',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        rememberMe: 'Remember Me',
        loginSuccess: 'Login successful',
        logoutSuccess: 'Logged out successfully',
        invalidCredentials: 'Invalid email or password',
      },

      // Dashboard
      dashboard: {
        welcomeBack: 'Welcome back',
        overview: 'Overview',
        recentActivity: 'Recent Activity',
        quickActions: 'Quick Actions',
        statistics: 'Statistics',
        testCases: 'Test Cases',
        testRuns: 'Test Runs',
        passRate: 'Pass Rate',
        openBugs: 'Open Bugs',
      },

      // Settings
      settings: {
        title: 'Settings',
        subtitle: 'Manage your account preferences and settings',
        general: 'General',
        notifications: 'Notifications',
        appearance: 'Appearance',
        security: 'Security',
        
        // General
        language: 'Language',
        timezone: 'Time Zone',
        
        // Notifications
        emailNotifications: 'Email Notifications',
        emailNotificationsDesc: 'Receive notifications via email',
        pushNotifications: 'Push Notifications',
        pushNotificationsDesc: 'Receive push notifications in browser',
        weeklyReports: 'Weekly Reports',
        weeklyReportsDesc: 'Receive weekly summary reports',
        
        // Appearance
        theme: 'Theme',
        light: 'Light',
        dark: 'Dark',
        auto: 'Auto',
        fontStyle: 'Font Style',
        fontDefault: 'Default',
        
        // Security
        updatePassword: 'Update Password',
        updatePasswordDesc: 'Update your password to keep your account secure',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmNewPassword: 'Confirm New Password',
        passwordMinLength: 'Minimum 8 characters',
        passwordUpdated: 'Password updated successfully',
        passwordMismatch: 'Passwords do not match',
        
        twoFactorAuth: 'Two-Factor Authentication',
        twoFactorAuthDesc: 'Add an extra layer of security to your account',
        enable2FA: 'Enable 2FA',
        comingSoon: 'Coming Soon',
        
        deleteAccount: 'Delete Account',
        deleteAccountDesc: 'Permanently delete your account and all associated data. This action cannot be undone.',
        deleteMyAccount: 'Delete My Account',
        deleteWarningTitle: 'Warning: This action is irreversible!',
        deleteWarningDesc: 'Your account will be deactivated and your data will be scheduled for deletion.',
        enterPasswordToConfirm: 'Enter your password to confirm',
        yourPassword: 'Your password',
        reasonForLeaving: 'Reason for leaving (optional)',
        reasonPlaceholder: 'Help us improve by telling us why you\'re leaving...',
        permanentlyDeleteAccount: 'Permanently Delete Account',
        
        settingsSaved: 'Settings saved successfully!',
        settingsFailed: 'Failed to save settings',
      },

      // Profile
      profile: {
        title: 'My Profile',
        subtitle: 'View and manage your profile information',
        fullName: 'Full Name',
        emailAddress: 'Email Address',
        role: 'Role',
        memberSince: 'Member Since',
        lastLogin: 'Last Login',
        assignedProjects: 'Assigned Projects',
        noProjects: 'No projects assigned yet',
        contactAdmin: 'Contact an administrator to get assigned to projects',
        connectedAccounts: 'Connected Accounts',
        editProfile: 'Edit Profile',
        profileUpdated: 'Profile updated successfully!',
        uploadPhoto: 'Upload photo',
        removePhoto: 'Remove photo',
        hoverToChange: 'Hover to change photo',
        verified: 'Verified',
        notVerified: 'Not verified',
        accountSettings: 'Account Settings',
      },

      // Test Cases
      testCases: {
        title: 'Test Cases',
        createNew: 'Create Test Case',
        name: 'Test Case Name',
        description: 'Description',
        steps: 'Steps',
        expectedResult: 'Expected Result',
        priority: 'Priority',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        status: 'Status',
        draft: 'Draft',
        active: 'Active',
        deprecated: 'Deprecated',
      },

      // Bugs
      bugs: {
        title: 'Bugs',
        createNew: 'Report Bug',
        bugTitle: 'Bug Title',
        description: 'Description',
        severity: 'Severity',
        critical: 'Critical',
        major: 'Major',
        minor: 'Minor',
        trivial: 'Trivial',
        status: 'Status',
        open: 'Open',
        inProgress: 'In Progress',
        resolved: 'Resolved',
        closed: 'Closed',
        assignedTo: 'Assigned To',
        reportedBy: 'Reported By',
      },

      // Time
      time: {
        never: 'Never',
        justNow: 'Just now',
        minutesAgo: '{{count}} minute ago',
        minutesAgo_other: '{{count}} minutes ago',
        hoursAgo: '{{count}} hour ago',
        hoursAgo_other: '{{count}} hours ago',
        daysAgo: '{{count}} day ago',
        daysAgo_other: '{{count}} days ago',
      },

      // Errors
      errors: {
        generic: 'Something went wrong',
        networkError: 'Network error. Please check your connection.',
        unauthorized: 'You are not authorized to perform this action',
        notFound: 'Resource not found',
        validationError: 'Please check your input',
      },
    },
  },

  es: {
    translation: {
      // Common
      common: {
        save: 'Guardar',
        saveChanges: 'Guardar Cambios',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        deleting: 'Eliminando...',
        edit: 'Editar',
        create: 'Crear',
        update: 'Actualizar',
        loading: 'Cargando...',
        saving: 'Guardando...',
        search: 'Buscar',
        filter: 'Filtrar',
        back: 'Atrás',
        next: 'Siguiente',
        previous: 'Anterior',
        submit: 'Enviar',
        confirm: 'Confirmar',
        close: 'Cerrar',
        yes: 'Sí',
        no: 'No',
        all: 'Todo',
        none: 'Ninguno',
        actions: 'Acciones',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
        success: 'Éxito',
        error: 'Error',
        warning: 'Advertencia',
        info: 'Información',
      },

      // Navigation
      nav: {
        dashboard: 'Panel',
        profile: 'Perfil',
        settings: 'Configuración',
        logout: 'Cerrar Sesión',
        createNewTest: 'Crear Nueva Prueba',
        reports: 'Informes',
        viewTestCases: 'Ver Casos de Prueba',
        testSuites: 'Suites de Prueba',
        bugs: 'Errores',
        chat: 'Chat',
        projects: 'Proyectos',
        users: 'Usuarios',
        analytics: 'Analíticas',
      },

      // Auth
      auth: {
        login: 'Iniciar Sesión',
        signup: 'Registrarse',
        forgotPassword: 'Olvidé mi Contraseña',
        resetPassword: 'Restablecer Contraseña',
        email: 'Correo Electrónico',
        password: 'Contraseña',
        confirmPassword: 'Confirmar Contraseña',
        rememberMe: 'Recordarme',
        loginSuccess: 'Inicio de sesión exitoso',
        logoutSuccess: 'Sesión cerrada correctamente',
        invalidCredentials: 'Correo electrónico o contraseña inválidos',
      },

      // Dashboard
      dashboard: {
        welcomeBack: 'Bienvenido de vuelta',
        overview: 'Resumen',
        recentActivity: 'Actividad Reciente',
        quickActions: 'Acciones Rápidas',
        statistics: 'Estadísticas',
        testCases: 'Casos de Prueba',
        testRuns: 'Ejecuciones de Prueba',
        passRate: 'Tasa de Aprobación',
        openBugs: 'Errores Abiertos',
      },

      // Settings
      settings: {
        title: 'Configuración',
        subtitle: 'Administra las preferencias y configuración de tu cuenta',
        general: 'General',
        notifications: 'Notificaciones',
        appearance: 'Apariencia',
        security: 'Seguridad',
        
        // General
        language: 'Idioma',
        timezone: 'Zona Horaria',
        
        // Notifications
        emailNotifications: 'Notificaciones por Correo',
        emailNotificationsDesc: 'Recibir notificaciones por correo electrónico',
        pushNotifications: 'Notificaciones Push',
        pushNotificationsDesc: 'Recibir notificaciones push en el navegador',
        weeklyReports: 'Informes Semanales',
        weeklyReportsDesc: 'Recibir resúmenes semanales',
        
        // Appearance
        theme: 'Tema',
        light: 'Claro',
        dark: 'Oscuro',
        auto: 'Automático',
        fontStyle: 'Estilo de Fuente',
        fontDefault: 'Predeterminado',
        
        // Security
        updatePassword: 'Actualizar Contraseña',
        updatePasswordDesc: 'Actualiza tu contraseña para mantener tu cuenta segura',
        currentPassword: 'Contraseña Actual',
        newPassword: 'Nueva Contraseña',
        confirmNewPassword: 'Confirmar Nueva Contraseña',
        passwordMinLength: 'Mínimo 8 caracteres',
        passwordUpdated: 'Contraseña actualizada correctamente',
        passwordMismatch: 'Las contraseñas no coinciden',
        
        twoFactorAuth: 'Autenticación de Dos Factores',
        twoFactorAuthDesc: 'Añade una capa extra de seguridad a tu cuenta',
        enable2FA: 'Habilitar 2FA',
        comingSoon: 'Próximamente',
        
        deleteAccount: 'Eliminar Cuenta',
        deleteAccountDesc: 'Elimina permanentemente tu cuenta y todos los datos asociados. Esta acción no se puede deshacer.',
        deleteMyAccount: 'Eliminar Mi Cuenta',
        deleteWarningTitle: '¡Advertencia: Esta acción es irreversible!',
        deleteWarningDesc: 'Tu cuenta será desactivada y tus datos serán programados para eliminación.',
        enterPasswordToConfirm: 'Ingresa tu contraseña para confirmar',
        yourPassword: 'Tu contraseña',
        reasonForLeaving: 'Razón para irse (opcional)',
        reasonPlaceholder: 'Ayúdanos a mejorar diciéndonos por qué te vas...',
        permanentlyDeleteAccount: 'Eliminar Cuenta Permanentemente',
        
        settingsSaved: '¡Configuración guardada correctamente!',
        settingsFailed: 'Error al guardar la configuración',
      },

      // Profile
      profile: {
        title: 'Mi Perfil',
        subtitle: 'Ver y administrar la información de tu perfil',
        fullName: 'Nombre Completo',
        emailAddress: 'Correo Electrónico',
        role: 'Rol',
        memberSince: 'Miembro Desde',
        lastLogin: 'Último Acceso',
        assignedProjects: 'Proyectos Asignados',
        noProjects: 'No hay proyectos asignados todavía',
        contactAdmin: 'Contacta a un administrador para ser asignado a proyectos',
        connectedAccounts: 'Cuentas Conectadas',
        editProfile: 'Editar Perfil',
        profileUpdated: '¡Perfil actualizado correctamente!',
        uploadPhoto: 'Subir foto',
        removePhoto: 'Eliminar foto',
        hoverToChange: 'Pasar el cursor para cambiar la foto',
        verified: 'Verificado',
        notVerified: 'No verificado',
        accountSettings: 'Configuración de Cuenta',
      },

      // Test Cases
      testCases: {
        title: 'Casos de Prueba',
        createNew: 'Crear Caso de Prueba',
        name: 'Nombre del Caso de Prueba',
        description: 'Descripción',
        steps: 'Pasos',
        expectedResult: 'Resultado Esperado',
        priority: 'Prioridad',
        high: 'Alta',
        medium: 'Media',
        low: 'Baja',
        status: 'Estado',
        draft: 'Borrador',
        active: 'Activo',
        deprecated: 'Obsoleto',
      },

      // Bugs
      bugs: {
        title: 'Errores',
        createNew: 'Reportar Error',
        bugTitle: 'Título del Error',
        description: 'Descripción',
        severity: 'Severidad',
        critical: 'Crítico',
        major: 'Mayor',
        minor: 'Menor',
        trivial: 'Trivial',
        status: 'Estado',
        open: 'Abierto',
        inProgress: 'En Progreso',
        resolved: 'Resuelto',
        closed: 'Cerrado',
        assignedTo: 'Asignado A',
        reportedBy: 'Reportado Por',
      },

      // Time
      time: {
        never: 'Nunca',
        justNow: 'Justo ahora',
        minutesAgo: 'Hace {{count}} minuto',
        minutesAgo_other: 'Hace {{count}} minutos',
        hoursAgo: 'Hace {{count}} hora',
        hoursAgo_other: 'Hace {{count}} horas',
        daysAgo: 'Hace {{count}} día',
        daysAgo_other: 'Hace {{count}} días',
      },

      // Errors
      errors: {
        generic: 'Algo salió mal',
        networkError: 'Error de red. Por favor verifica tu conexión.',
        unauthorized: 'No estás autorizado para realizar esta acción',
        notFound: 'Recurso no encontrado',
        validationError: 'Por favor verifica tu entrada',
      },
    },
  },

  fr: {
    translation: {
      // Common
      common: {
        save: 'Enregistrer',
        saveChanges: 'Enregistrer les modifications',
        cancel: 'Annuler',
        delete: 'Supprimer',
        deleting: 'Suppression...',
        edit: 'Modifier',
        create: 'Créer',
        update: 'Mettre à jour',
        loading: 'Chargement...',
        saving: 'Enregistrement...',
        search: 'Rechercher',
        filter: 'Filtrer',
        back: 'Retour',
        next: 'Suivant',
        previous: 'Précédent',
        submit: 'Soumettre',
        confirm: 'Confirmer',
        close: 'Fermer',
        yes: 'Oui',
        no: 'Non',
        all: 'Tout',
        none: 'Aucun',
        actions: 'Actions',
        status: 'Statut',
        active: 'Actif',
        inactive: 'Inactif',
        success: 'Succès',
        error: 'Erreur',
        warning: 'Avertissement',
        info: 'Information',
      },

      // Navigation
      nav: {
        dashboard: 'Tableau de bord',
        profile: 'Profil',
        settings: 'Paramètres',
        logout: 'Déconnexion',
        createNewTest: 'Créer un nouveau test',
        reports: 'Rapports',
        viewTestCases: 'Voir les cas de test',
        testSuites: 'Suites de tests',
        bugs: 'Bugs',
        chat: 'Chat',
        projects: 'Projets',
        users: 'Utilisateurs',
        analytics: 'Analytique',
      },

      // Auth
      auth: {
        login: 'Connexion',
        signup: "S'inscrire",
        forgotPassword: 'Mot de passe oublié',
        resetPassword: 'Réinitialiser le mot de passe',
        email: 'Email',
        password: 'Mot de passe',
        confirmPassword: 'Confirmer le mot de passe',
        rememberMe: 'Se souvenir de moi',
        loginSuccess: 'Connexion réussie',
        logoutSuccess: 'Déconnexion réussie',
        invalidCredentials: 'Email ou mot de passe invalide',
      },

      // Dashboard
      dashboard: {
        welcomeBack: 'Bienvenue',
        overview: 'Aperçu',
        recentActivity: 'Activité récente',
        quickActions: 'Actions rapides',
        statistics: 'Statistiques',
        testCases: 'Cas de test',
        testRuns: 'Exécutions de tests',
        passRate: 'Taux de réussite',
        openBugs: 'Bugs ouverts',
      },

      // Settings
      settings: {
        title: 'Paramètres',
        subtitle: 'Gérez les préférences et paramètres de votre compte',
        general: 'Général',
        notifications: 'Notifications',
        appearance: 'Apparence',
        security: 'Sécurité',
        
        // General
        language: 'Langue',
        timezone: 'Fuseau horaire',
        
        // Notifications
        emailNotifications: 'Notifications par email',
        emailNotificationsDesc: 'Recevoir des notifications par email',
        pushNotifications: 'Notifications push',
        pushNotificationsDesc: 'Recevoir des notifications push dans le navigateur',
        weeklyReports: 'Rapports hebdomadaires',
        weeklyReportsDesc: 'Recevoir des résumés hebdomadaires',
        
        // Appearance
        theme: 'Thème',
        light: 'Clair',
        dark: 'Sombre',
        auto: 'Automatique',
        fontStyle: 'Style de Police',
        fontDefault: 'Par Défaut',
        
        // Security
        updatePassword: 'Mettre à jour le mot de passe',
        updatePasswordDesc: 'Mettez à jour votre mot de passe pour sécuriser votre compte',
        currentPassword: 'Mot de passe actuel',
        newPassword: 'Nouveau mot de passe',
        confirmNewPassword: 'Confirmer le nouveau mot de passe',
        passwordMinLength: 'Minimum 8 caractères',
        passwordUpdated: 'Mot de passe mis à jour avec succès',
        passwordMismatch: 'Les mots de passe ne correspondent pas',
        
        twoFactorAuth: 'Authentification à deux facteurs',
        twoFactorAuthDesc: 'Ajoutez une couche de sécurité supplémentaire à votre compte',
        enable2FA: 'Activer 2FA',
        comingSoon: 'Bientôt disponible',
        
        deleteAccount: 'Supprimer le compte',
        deleteAccountDesc: 'Supprimez définitivement votre compte et toutes les données associées. Cette action est irréversible.',
        deleteMyAccount: 'Supprimer mon compte',
        deleteWarningTitle: 'Attention : Cette action est irréversible !',
        deleteWarningDesc: 'Votre compte sera désactivé et vos données seront programmées pour suppression.',
        enterPasswordToConfirm: 'Entrez votre mot de passe pour confirmer',
        yourPassword: 'Votre mot de passe',
        reasonForLeaving: 'Raison du départ (optionnel)',
        reasonPlaceholder: 'Aidez-nous à nous améliorer en nous disant pourquoi vous partez...',
        permanentlyDeleteAccount: 'Supprimer définitivement le compte',
        
        settingsSaved: 'Paramètres enregistrés avec succès !',
        settingsFailed: 'Échec de l\'enregistrement des paramètres',
      },

      // Profile
      profile: {
        title: 'Mon profil',
        subtitle: 'Voir et gérer les informations de votre profil',
        fullName: 'Nom complet',
        emailAddress: 'Adresse email',
        role: 'Rôle',
        memberSince: 'Membre depuis',
        lastLogin: 'Dernière connexion',
        assignedProjects: 'Projets assignés',
        noProjects: 'Aucun projet assigné pour le moment',
        contactAdmin: 'Contactez un administrateur pour être assigné à des projets',
        connectedAccounts: 'Comptes connectés',
        editProfile: 'Modifier le profil',
        profileUpdated: 'Profil mis à jour avec succès !',
        uploadPhoto: 'Télécharger une photo',
        removePhoto: 'Supprimer la photo',
        hoverToChange: 'Survolez pour changer la photo',
        verified: 'Vérifié',
        notVerified: 'Non vérifié',
        accountSettings: 'Paramètres du compte',
      },

      // Test Cases
      testCases: {
        title: 'Cas de test',
        createNew: 'Créer un cas de test',
        name: 'Nom du cas de test',
        description: 'Description',
        steps: 'Étapes',
        expectedResult: 'Résultat attendu',
        priority: 'Priorité',
        high: 'Haute',
        medium: 'Moyenne',
        low: 'Basse',
        status: 'Statut',
        draft: 'Brouillon',
        active: 'Actif',
        deprecated: 'Obsolète',
      },

      // Bugs
      bugs: {
        title: 'Bugs',
        createNew: 'Signaler un bug',
        bugTitle: 'Titre du bug',
        description: 'Description',
        severity: 'Sévérité',
        critical: 'Critique',
        major: 'Majeur',
        minor: 'Mineur',
        trivial: 'Trivial',
        status: 'Statut',
        open: 'Ouvert',
        inProgress: 'En cours',
        resolved: 'Résolu',
        closed: 'Fermé',
        assignedTo: 'Assigné à',
        reportedBy: 'Signalé par',
      },

      // Time
      time: {
        never: 'Jamais',
        justNow: 'À l\'instant',
        minutesAgo: 'Il y a {{count}} minute',
        minutesAgo_other: 'Il y a {{count}} minutes',
        hoursAgo: 'Il y a {{count}} heure',
        hoursAgo_other: 'Il y a {{count}} heures',
        daysAgo: 'Il y a {{count}} jour',
        daysAgo_other: 'Il y a {{count}} jours',
      },

      // Errors
      errors: {
        generic: 'Une erreur est survenue',
        networkError: 'Erreur réseau. Veuillez vérifier votre connexion.',
        unauthorized: 'Vous n\'êtes pas autorisé à effectuer cette action',
        notFound: 'Ressource non trouvée',
        validationError: 'Veuillez vérifier vos entrées',
      },
    },
  },

  de: {
    translation: {
      // Common
      common: {
        save: 'Speichern',
        saveChanges: 'Änderungen speichern',
        cancel: 'Abbrechen',
        delete: 'Löschen',
        deleting: 'Löschen...',
        edit: 'Bearbeiten',
        create: 'Erstellen',
        update: 'Aktualisieren',
        loading: 'Laden...',
        saving: 'Speichern...',
        search: 'Suchen',
        filter: 'Filtern',
        back: 'Zurück',
        next: 'Weiter',
        previous: 'Zurück',
        submit: 'Absenden',
        confirm: 'Bestätigen',
        close: 'Schließen',
        yes: 'Ja',
        no: 'Nein',
        all: 'Alle',
        none: 'Keine',
        actions: 'Aktionen',
        status: 'Status',
        active: 'Aktiv',
        inactive: 'Inaktiv',
        success: 'Erfolg',
        error: 'Fehler',
        warning: 'Warnung',
        info: 'Information',
      },

      // Navigation
      nav: {
        dashboard: 'Dashboard',
        profile: 'Profil',
        settings: 'Einstellungen',
        logout: 'Abmelden',
        createNewTest: 'Neuen Test erstellen',
        reports: 'Berichte',
        viewTestCases: 'Testfälle anzeigen',
        testSuites: 'Test-Suiten',
        bugs: 'Fehler',
        chat: 'Chat',
        projects: 'Projekte',
        users: 'Benutzer',
        analytics: 'Analytik',
      },

      // Auth
      auth: {
        login: 'Anmelden',
        signup: 'Registrieren',
        forgotPassword: 'Passwort vergessen',
        resetPassword: 'Passwort zurücksetzen',
        email: 'E-Mail',
        password: 'Passwort',
        confirmPassword: 'Passwort bestätigen',
        rememberMe: 'Angemeldet bleiben',
        loginSuccess: 'Anmeldung erfolgreich',
        logoutSuccess: 'Erfolgreich abgemeldet',
        invalidCredentials: 'Ungültige E-Mail oder Passwort',
      },

      // Dashboard
      dashboard: {
        welcomeBack: 'Willkommen zurück',
        overview: 'Übersicht',
        recentActivity: 'Letzte Aktivität',
        quickActions: 'Schnellaktionen',
        statistics: 'Statistiken',
        testCases: 'Testfälle',
        testRuns: 'Testläufe',
        passRate: 'Erfolgsquote',
        openBugs: 'Offene Fehler',
      },

      // Settings
      settings: {
        title: 'Einstellungen',
        subtitle: 'Verwalten Sie Ihre Kontoeinstellungen und Präferenzen',
        general: 'Allgemein',
        notifications: 'Benachrichtigungen',
        appearance: 'Erscheinungsbild',
        security: 'Sicherheit',
        
        // General
        language: 'Sprache',
        timezone: 'Zeitzone',
        
        // Notifications
        emailNotifications: 'E-Mail-Benachrichtigungen',
        emailNotificationsDesc: 'Benachrichtigungen per E-Mail erhalten',
        pushNotifications: 'Push-Benachrichtigungen',
        pushNotificationsDesc: 'Push-Benachrichtigungen im Browser erhalten',
        weeklyReports: 'Wöchentliche Berichte',
        weeklyReportsDesc: 'Wöchentliche Zusammenfassungen erhalten',
        
        // Appearance
        theme: 'Design',
        light: 'Hell',
        dark: 'Dunkel',
        auto: 'Automatisch',
        fontStyle: 'Schriftstil',
        fontDefault: 'Standard',
        
        // Security
        updatePassword: 'Passwort aktualisieren',
        updatePasswordDesc: 'Aktualisieren Sie Ihr Passwort, um Ihr Konto zu schützen',
        currentPassword: 'Aktuelles Passwort',
        newPassword: 'Neues Passwort',
        confirmNewPassword: 'Neues Passwort bestätigen',
        passwordMinLength: 'Mindestens 8 Zeichen',
        passwordUpdated: 'Passwort erfolgreich aktualisiert',
        passwordMismatch: 'Passwörter stimmen nicht überein',
        
        twoFactorAuth: 'Zwei-Faktor-Authentifizierung',
        twoFactorAuthDesc: 'Fügen Sie Ihrem Konto eine zusätzliche Sicherheitsebene hinzu',
        enable2FA: '2FA aktivieren',
        comingSoon: 'Demnächst verfügbar',
        
        deleteAccount: 'Konto löschen',
        deleteAccountDesc: 'Löschen Sie Ihr Konto und alle zugehörigen Daten dauerhaft. Diese Aktion kann nicht rückgängig gemacht werden.',
        deleteMyAccount: 'Mein Konto löschen',
        deleteWarningTitle: 'Warnung: Diese Aktion ist unwiderruflich!',
        deleteWarningDesc: 'Ihr Konto wird deaktiviert und Ihre Daten werden zur Löschung vorgemerkt.',
        enterPasswordToConfirm: 'Geben Sie Ihr Passwort zur Bestätigung ein',
        yourPassword: 'Ihr Passwort',
        reasonForLeaving: 'Grund für das Verlassen (optional)',
        reasonPlaceholder: 'Helfen Sie uns, uns zu verbessern, indem Sie uns sagen, warum Sie gehen...',
        permanentlyDeleteAccount: 'Konto dauerhaft löschen',
        
        settingsSaved: 'Einstellungen erfolgreich gespeichert!',
        settingsFailed: 'Einstellungen konnten nicht gespeichert werden',
      },

      // Profile
      profile: {
        title: 'Mein Profil',
        subtitle: 'Profilinformationen anzeigen und verwalten',
        fullName: 'Vollständiger Name',
        emailAddress: 'E-Mail-Adresse',
        role: 'Rolle',
        memberSince: 'Mitglied seit',
        lastLogin: 'Letzte Anmeldung',
        assignedProjects: 'Zugewiesene Projekte',
        noProjects: 'Noch keine Projekte zugewiesen',
        contactAdmin: 'Kontaktieren Sie einen Administrator, um Projekten zugewiesen zu werden',
        connectedAccounts: 'Verbundene Konten',
        editProfile: 'Profil bearbeiten',
        profileUpdated: 'Profil erfolgreich aktualisiert!',
        uploadPhoto: 'Foto hochladen',
        removePhoto: 'Foto entfernen',
        hoverToChange: 'Zum Ändern des Fotos darüberfahren',
        verified: 'Verifiziert',
        notVerified: 'Nicht verifiziert',
        accountSettings: 'Kontoeinstellungen',
      },

      // Test Cases
      testCases: {
        title: 'Testfälle',
        createNew: 'Testfall erstellen',
        name: 'Testfallname',
        description: 'Beschreibung',
        steps: 'Schritte',
        expectedResult: 'Erwartetes Ergebnis',
        priority: 'Priorität',
        high: 'Hoch',
        medium: 'Mittel',
        low: 'Niedrig',
        status: 'Status',
        draft: 'Entwurf',
        active: 'Aktiv',
        deprecated: 'Veraltet',
      },

      // Bugs
      bugs: {
        title: 'Fehler',
        createNew: 'Fehler melden',
        bugTitle: 'Fehlertitel',
        description: 'Beschreibung',
        severity: 'Schweregrad',
        critical: 'Kritisch',
        major: 'Schwer',
        minor: 'Leicht',
        trivial: 'Trivial',
        status: 'Status',
        open: 'Offen',
        inProgress: 'In Bearbeitung',
        resolved: 'Gelöst',
        closed: 'Geschlossen',
        assignedTo: 'Zugewiesen an',
        reportedBy: 'Gemeldet von',
      },

      // Time
      time: {
        never: 'Nie',
        justNow: 'Gerade eben',
        minutesAgo: 'Vor {{count}} Minute',
        minutesAgo_other: 'Vor {{count}} Minuten',
        hoursAgo: 'Vor {{count}} Stunde',
        hoursAgo_other: 'Vor {{count}} Stunden',
        daysAgo: 'Vor {{count}} Tag',
        daysAgo_other: 'Vor {{count}} Tagen',
      },

      // Errors
      errors: {
        generic: 'Etwas ist schief gelaufen',
        networkError: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.',
        unauthorized: 'Sie sind nicht berechtigt, diese Aktion auszuführen',
        notFound: 'Ressource nicht gefunden',
        validationError: 'Bitte überprüfen Sie Ihre Eingabe',
      },
    },
  },

  sv: {
    translation: {
      // Common
      common: {
        save: 'Spara',
        saveChanges: 'Spara ändringar',
        cancel: 'Avbryt',
        delete: 'Ta bort',
        deleting: 'Tar bort...',
        edit: 'Redigera',
        create: 'Skapa',
        update: 'Uppdatera',
        loading: 'Laddar...',
        saving: 'Sparar...',
        search: 'Sök',
        filter: 'Filtrera',
        back: 'Tillbaka',
        next: 'Nästa',
        previous: 'Föregående',
        submit: 'Skicka',
        confirm: 'Bekräfta',
        close: 'Stäng',
        yes: 'Ja',
        no: 'Nej',
        all: 'Alla',
        none: 'Ingen',
        actions: 'Åtgärder',
        status: 'Status',
        active: 'Aktiv',
        inactive: 'Inaktiv',
        success: 'Lyckades',
        error: 'Fel',
        warning: 'Varning',
        info: 'Information',
      },

      // Navigation
      nav: {
        dashboard: 'Instrumentpanel',
        profile: 'Profil',
        settings: 'Inställningar',
        logout: 'Logga ut',
        createNewTest: 'Skapa nytt test',
        reports: 'Rapporter',
        viewTestCases: 'Visa testfall',
        testSuites: 'Testsviter',
        bugs: 'Buggar',
        chat: 'Chatt',
        projects: 'Projekt',
        users: 'Användare',
        analytics: 'Analys',
      },

      // Auth
      auth: {
        login: 'Logga in',
        signup: 'Registrera dig',
        forgotPassword: 'Glömt lösenord',
        resetPassword: 'Återställ lösenord',
        email: 'E-post',
        password: 'Lösenord',
        confirmPassword: 'Bekräfta lösenord',
        rememberMe: 'Kom ihåg mig',
        loginSuccess: 'Inloggning lyckades',
        logoutSuccess: 'Utloggning lyckades',
        invalidCredentials: 'Ogiltig e-post eller lösenord',
      },

      // Dashboard
      dashboard: {
        welcomeBack: 'Välkommen tillbaka',
        overview: 'Översikt',
        recentActivity: 'Senaste aktivitet',
        quickActions: 'Snabbåtgärder',
        statistics: 'Statistik',
        testCases: 'Testfall',
        testRuns: 'Testkörningar',
        passRate: 'Godkännandeprocent',
        openBugs: 'Öppna buggar',
      },

      // Settings
      settings: {
        title: 'Inställningar',
        subtitle: 'Hantera dina kontoinställningar och preferenser',
        general: 'Allmänt',
        notifications: 'Aviseringar',
        appearance: 'Utseende',
        security: 'Säkerhet',
        
        // General
        language: 'Språk',
        timezone: 'Tidszon',
        
        // Notifications
        emailNotifications: 'E-postaviseringar',
        emailNotificationsDesc: 'Ta emot aviseringar via e-post',
        pushNotifications: 'Push-aviseringar',
        pushNotificationsDesc: 'Ta emot push-aviseringar i webbläsaren',
        weeklyReports: 'Veckorapporter',
        weeklyReportsDesc: 'Ta emot veckovisa sammanfattningar',
        
        // Appearance
        theme: 'Tema',
        light: 'Ljust',
        dark: 'Mörkt',
        auto: 'Automatiskt',
        fontStyle: 'Teckensnitt',
        fontDefault: 'Standard',
        
        // Security
        updatePassword: 'Uppdatera lösenord',
        updatePasswordDesc: 'Uppdatera ditt lösenord för att hålla ditt konto säkert',
        currentPassword: 'Nuvarande lösenord',
        newPassword: 'Nytt lösenord',
        confirmNewPassword: 'Bekräfta nytt lösenord',
        passwordMinLength: 'Minst 8 tecken',
        passwordUpdated: 'Lösenord uppdaterat',
        passwordMismatch: 'Lösenorden matchar inte',
        
        twoFactorAuth: 'Tvåfaktorsautentisering',
        twoFactorAuthDesc: 'Lägg till ett extra säkerhetslager på ditt konto',
        enable2FA: 'Aktivera 2FA',
        comingSoon: 'Kommer snart',
        
        deleteAccount: 'Ta bort konto',
        deleteAccountDesc: 'Ta bort ditt konto och all tillhörande data permanent. Denna åtgärd kan inte ångras.',
        deleteMyAccount: 'Ta bort mitt konto',
        deleteWarningTitle: 'Varning: Denna åtgärd kan inte ångras!',
        deleteWarningDesc: 'Ditt konto kommer att inaktiveras och dina data kommer att schemaläggas för borttagning.',
        enterPasswordToConfirm: 'Ange ditt lösenord för att bekräfta',
        yourPassword: 'Ditt lösenord',
        reasonForLeaving: 'Anledning till att lämna (valfritt)',
        reasonPlaceholder: 'Hjälp oss att förbättras genom att berätta varför du lämnar...',
        permanentlyDeleteAccount: 'Ta bort kontot permanent',
        
        settingsSaved: 'Inställningar sparade!',
        settingsFailed: 'Kunde inte spara inställningar',
      },

      // Profile
      profile: {
        title: 'Min profil',
        subtitle: 'Visa och hantera din profilinformation',
        fullName: 'Fullständigt namn',
        emailAddress: 'E-postadress',
        role: 'Roll',
        memberSince: 'Medlem sedan',
        lastLogin: 'Senaste inloggning',
        assignedProjects: 'Tilldelade projekt',
        noProjects: 'Inga projekt tilldelade ännu',
        contactAdmin: 'Kontakta en administratör för att bli tilldelad projekt',
        connectedAccounts: 'Anslutna konton',
        editProfile: 'Redigera profil',
        profileUpdated: 'Profil uppdaterad!',
        uploadPhoto: 'Ladda upp foto',
        removePhoto: 'Ta bort foto',
        hoverToChange: 'Håll muspekaren över för att ändra foto',
        verified: 'Verifierad',
        notVerified: 'Ej verifierad',
        accountSettings: 'Kontoinställningar',
      },

      // Test Cases
      testCases: {
        title: 'Testfall',
        createNew: 'Skapa testfall',
        name: 'Testfallsnamn',
        description: 'Beskrivning',
        steps: 'Steg',
        expectedResult: 'Förväntat resultat',
        priority: 'Prioritet',
        high: 'Hög',
        medium: 'Medel',
        low: 'Låg',
        status: 'Status',
        draft: 'Utkast',
        active: 'Aktiv',
        deprecated: 'Föråldrad',
      },

      // Bugs
      bugs: {
        title: 'Buggar',
        createNew: 'Rapportera bugg',
        bugTitle: 'Buggtitel',
        description: 'Beskrivning',
        severity: 'Allvarlighetsgrad',
        critical: 'Kritisk',
        major: 'Stor',
        minor: 'Mindre',
        trivial: 'Trivial',
        status: 'Status',
        open: 'Öppen',
        inProgress: 'Pågår',
        resolved: 'Löst',
        closed: 'Stängd',
        assignedTo: 'Tilldelad till',
        reportedBy: 'Rapporterad av',
      },

      // Time
      time: {
        never: 'Aldrig',
        justNow: 'Just nu',
        minutesAgo: 'För {{count}} minut sedan',
        minutesAgo_other: 'För {{count}} minuter sedan',
        hoursAgo: 'För {{count}} timme sedan',
        hoursAgo_other: 'För {{count}} timmar sedan',
        daysAgo: 'För {{count}} dag sedan',
        daysAgo_other: 'För {{count}} dagar sedan',
      },

      // Errors
      errors: {
        generic: 'Något gick fel',
        networkError: 'Nätverksfel. Kontrollera din anslutning.',
        unauthorized: 'Du har inte behörighet att utföra denna åtgärd',
        notFound: 'Resurs hittades inte',
        validationError: 'Kontrollera din inmatning',
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'language',
      caches: ['localStorage'],
    },
  });

export default i18n;
