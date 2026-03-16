import React, { useState, useEffect } from "react";
import {X, Share, PlusSquare, MoreHorizontal, DownloadCloud} from "lucide-react";
// import style from './PwaInstallPromt.module.css';


// Этот блок появится снизу только у пользователей iPhone, чтобы подсказать им, как установить приложение.

const PwaInstallPrompt: React.FC = () => {
    // Стейт для iOS инструкции
    const [showIosPromt, setShowIosPromt] = useState(false);

    // Стейт для Android/Desktop кнопки (хранит само системное событие установки) - (Chrome, Edge, Яндекс.Браузер, Opera)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // ==========================================
        // 1. ЛОГИКА ДЛЯ iOS (Инструкция)
        // ==========================================
        const isIos = () => {
            const userAgent = window.navigator.userAgent.toLowerCase();
            return /iphone|ipad|ipod/.test(userAgent);
        };

        // Проверяем, что приложение еще НЕ установлено (не в standalone режиме)
        const isInStandaloneMode = () => {
            return ('standalone' in window.navigator) && (window.navigator as any).stadalone;
        };

        // Проверяем, не закрывал ли уже пользователь эту плашку
        const hasClosedPromt = localStorage.getItem('pwaPromtClosed');

        if (isIos() && !isInStandaloneMode() && !hasClosedPromt) {
            setShowIosPromt(true);
        }

        // ==========================================
        // 2. ЛОГИКА ДЛЯ ANDROID / DESKTOP (Кнопка)
        // ==========================================
        const handleBeforeInstallPromt = (e: Event) => {
            // Предотвращаем стандартное мини-окошко браузера
            e.preventDefault();
            // Сохраняем событие, чтобы вызвать его по клику на НАШУ кнопку
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPromt);

        // Если пользователь успешно установил приложение, прячем кнопку
        window.addEventListener('appinstalled', () => {
            setDeferredPrompt(null);
            console.log('Приложение успешно установлено!');
        });

    }, []);

    // --- ОБРАБОТЧИКИ КЛИКОВ ---
    const closeIosPrompt = () => {
        setShowIosPromt(false);
        localStorage.setItem('pwaPromtClosed', 'true');
    };

    const closeAndroidPrompt = () => {
        setDeferredPrompt(null);
    };

    const handleInstallClock = async () => {
        if (!deferredPrompt) return;

        // 1. САМОЕ ГЛАВНОЕ: Показываем системное окно установки браузера!
        deferredPrompt.prompt();

        // Ждем ответа от пользователя (согласился или отказался)
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('Пользователь согласился на установку');
        } else {
            console.log('Пользователь отказался от установки');
        }

        // Событие можно использовать только один раз, поэтому очищаем его
        setDeferredPrompt(null);
    };

    // --- РЕНДЕР КОМПОНЕНТА ---

    // Если нет ни iOS, ни доступной установки для Android — ничего не рендерим

    if (!showIosPromt && !deferredPrompt) return null;

    // Общий стиль для плашки (чтобы не дублировать код)
    const popupStyle: React.CSSProperties = {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '400px',
        backgroundColor: '#123C69',
        color: 'white',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        zIndex: 9999
    };

    return (
        <div style={popupStyle}>

            {/* ВАРИАНТ А: Пользователь на Android / ПК (Показываем кнопку) */}
            {deferredPrompt && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <DownloadCloud size={24} /> Скачайте приложение
                        </strong>
                        <button onClick={closeAndroidPrompt} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
                            <X size={24} />
                        </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>
                        Установите «Рецепты» на свой телефон для быстрого доступа и работы без браузера.
                    </p>
                    <button
                        onClick={handleInstallClock}
                        style={{
                            backgroundColor: '#AC3B61',
                            color: 'white',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            marginTop: '5px'
                        }}
                    >
                        Установить сейчас
                    </button>
                </>
            )}


            {/* ВАРИАНТ Б: Пользователь на iOS (Показываем инструкцию) */}
            {showIosPromt && !deferredPrompt && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '1.2rem' }}>Установка приложения</strong>
                        <button onClick={closeIosPrompt} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
                            <X size={24} />
                        </button>
                    </div>

                    <div style={{ fontSize: '0.95rem', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                            1. Нажмите на кнопку меню <MoreHorizontal size={20} style={{ verticalAlign: 'sub', margin: '0 2px' }} /> справа от адресной строки внизу экрана.
                        </div>
                        <div>
                            2. В появившемся списке выберите <Share size={20} style={{ verticalAlign: 'sub', margin: '0 2px' }} /> <b>Поделиться</b>.
                        </div>
                        <div>
                            3. В открывшемся окне <b>прокрутите список действий вниз</b> (под ряд с иконками приложений).
                        </div>
                        <div>
                            4. Нажмите <PlusSquare size={20} style={{ verticalAlign: 'sub', margin: '0 2px' }} /> <b>На экран «Домой»</b>.
                        </div>
                    </div>
                </>
            )}

        </div>
    );
};

export default PwaInstallPrompt;