// import React from 'react';
import styles from './RecipeSkeleton.module.css';

export const RecipeSkeleton = () => {
    return (
        <div className={styles.skeletonCard}>
            {/* Заглушка для заголовка */}
            <div className={`${styles.pulseBlock} ${styles.titlePlaceholder}`}></div>

            <div className={styles.mainContent}>
                {/* Заглушка для фото */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px'}}>
                    <div className={`${styles.pulseBlock} ${styles.textPlaceholder}`}></div>
                    <div className={`${styles.pulseBlock} ${styles.textPlaceholder}`}></div>
                    <div className={`${styles.pulseBlock} ${styles.textPlaceholderShort}`}></div>
                </div>
            </div>

            {/* Заглушка для ингредиентов */}
            <div className={`${styles.pulseBlock} ${styles.textPlaceholder}`} style={{ marginTop: 'auto'}}></div>
        </div>
    )
}