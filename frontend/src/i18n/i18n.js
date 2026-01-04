import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    en: {
        translation: {
            "welcome": "Welcome to E-Learning",
            "login": "Login",
            "username": "Username",
            "password": "Password",
        }
    },
    fr: {
        translation: {
            "welcome": "Bienvenue sur E-Learning",
            "login": "Connexion",
            "username": "Nom d'utilisateur",
            "password": "Mot de passe",
        }
    },
    ar: {
        translation: {
            "welcome": "مرحبًا بكم في التعلم الإلكتروني",
            "login": "تسجيل الدخول",
            "username": "اسم المستخدم",
            "password": "كلمة المرور",
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "fr", // Default language
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
