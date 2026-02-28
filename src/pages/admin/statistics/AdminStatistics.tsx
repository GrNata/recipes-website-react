import React, {useEffect, useState} from "react";
import { adminApi } from "../../../api/admin";
import {Users, Utensils, Soup, ChefHat, Trophy, Star, BookOpen} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import type {Statistics, UserRatingDto} from "../../../types";
import style from './AdminStatistics.module.css';

// Цвета для круговой диаграммы
const COLORS = ['#AC3B61', '#123C69', '#41728F', '#D2787A', '#FFD200'];

export const AdminStatistics: React.FC = () => {
    const [stats, setStats] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [topRatingUsers, setTopRatingUsers] = useState<UserRatingDto[]>([]);

    useEffect(() => {
        const loadState = async () => {
            try {
                // Запускаем оба запроса одновременно
                // const data = await adminApi.getStatistics();
                const [statsData, topUsersData] = await Promise.all([
                    adminApi.getStatistics(),
                    adminApi.getTopUsersByRating(0, 5)
                ]);
                // setStats(data);
                setStats(statsData);
                setTopRatingUsers(topUsersData);
            } catch (e) {
                console.error('Ошибка загрузки статистики ', e);
            } finally {
                setLoading(false);
            }
        };
        loadState();
    }, []);

    if (loading) return <div>Загрузка црфр...</div>

    return (
        <div className={style.container}>
            <h2 style={{ color: '#123C69', marginBottom: '30px'}}>Общая статистика</h2>

            <div className={style.grid1}>
                <div className={style.statCard}>
                    <Users size={32} color={'#AC3B61'} />
                    <span className={style.statValue}>{stats?.totalUsers || 0}</span>
                    <span className={style.statLabel}>Пользователей</span>
                </div>

                <div className={style.statCard}>
                    <Utensils size={32} color={'#AC3B61'} />
                    <span className={style.statValue}>{stats?.totalRecipes || 0}</span>
                    <span className={style.statLabel}>Всего рецептов</span>
                </div>
            {/*</div>*/}

            {/*<div className={style.grid2}>*/}
            {/*    <div className={style.statCard}>*/}
                <div className={style.listContainer}>
                    <Soup size={32} color={'#AC3B61'} />
                    {stats?.popularCategoriesValue.map((category, index) => (
                        <div key={index} className={style.statRow}>
                            <span className={style.statValueName}>{category.categoryValueName || 0} </span>
                            <span className={style.statValueCount}>{category.recipeCount || 0} </span>
                        </div>
                    ))}
                    <span className={style.statLabel}>Популярные категории</span>
                </div>

                <div className={style.listContainer}>
                    {/*<UserRoundCog size={32} color={'#AC3B61'} />*/}
                    <ChefHat size={32} color={'#AC3B61'} />
                    {stats?.topAuthors.map((author, index) => (
                        <div key={index} className={style.statRow}>
                            <span className={style.statValueName}>{author.username || 0} </span>
                            <span className={style.statValueCount}>{author.recipeCount || 0}</span>
                        </div>
                    ))}
                    <span className={style.statLabel}>Популярные авторы</span>
                </div>
            </div>

            {/* НОВАЯ СЕКЦИЯ: КАРТОЧКИ ТОП АВТОРОВ */}
            <h3 style={{ color: '#123C69', marginTop: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Trophy color='#123c69' /> Лидеры по рейтингу рецептов
            </h3>
            <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', marginBottom: '30px', padding: '10px 0' }}>
                {topRatingUsers.map((user, index) => (
                    <div key={user.userId} className={style.statCard} style={{ minWidth: '200px', borderTop: `4px solid ${COLORS[index]}` }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{user.userName}</div>
                        <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>{user.email}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FFD200', fontWeight: 'bold' }}>
                                <Star size={16} fill="#FFD200" /> {user.averageRating.toFixed(1)}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#41728F' }}>
                                <BookOpen size={16} /> {user.recipeCount}
                            </span>
                        </div>
                    </div>
                ))}
            </div>


            {/* Сюда позже добавим график активности через Recharts */}
            {/* ГРАФИК 1: ПОПУЛЯРНЫЕ КАТЕГОРИИ (BarChart) */}
            <div className={style.chartContainer}>
                <h3 className={style.chartTitle}>Распределение по категориям (топ 5 популярных категорий)</h3>
                <ResponsiveContainer width='100%' height={300}>
                    <BarChart data={stats?.popularCategoriesValue}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} style={{ color: '#123B69'}}/>
                        <XAxis  dataKey="categoryValueName"/>
                        <YAxis dataKey="recipeCount" />
                        <Tooltip
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1'}}
                        />
                        <Bar
                        dataKey='recipeCount'
                        fill='#AC3B61'
                        radius={[4, 4, 0, 0]}
                        name='Количество рецептов'
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className={style.grid2} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* ГРАФИК 2: ТОП АВТОРОВ (PieChart) */}
                <div className={style.chartContainer}>
                    <h3 className={style.chartTitle}>Доля рецептов по авторам (5 лучших авторов)</h3>
                    <ResponsiveContainer width='100%' height={300}>
                        <PieChart>
                            <Pie
                                data={stats?.topAuthors}
                                dataKey='recipeCount'
                                nameKey='username'
                                cx='50%'
                                cy='50%'
                                outerRadius={80}
                                label
                            >
                                {stats?.topAuthors.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* НОВЫЙ ГРАФИК: РЕЙТИНГ */}
                <div className={style.chartContainer}>
                    <h3 className={style.chartTitle}>Средний рейтинг авторов (Топ-5)</h3>
                    <ResponsiveContainer width='100%' height={300}>
                        <BarChart data={topRatingUsers}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="userName" />
                            <YAxis domain={[0, 5]} />
                            <Tooltip />
                            <Bar dataKey="averageRating" name="Средний рейтинг" radius={[4, 4, 0, 0]}>
                                {topRatingUsers.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

            </div>

        </div>
    )
};

export default AdminStatistics;