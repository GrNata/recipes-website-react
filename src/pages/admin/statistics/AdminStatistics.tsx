import React, {useEffect, useState} from "react";
import { adminApi } from "../../../api/admin";
import {Users, Utensils, Zap, Database, Soup, UserRoundCog, ChefHat} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { Statistics } from "../../../types";
import style from './AdminStatistics.module.css';
import {n} from "vite/dist/node/chunks/moduleRunnerTransport";

// Цвета для круговой диаграммы
const COLORS = ['#AC3B61', '#123C69', '#41728F', '#D2787A', '#FFD200'];

export const AdminStatistics: React.FC = () => {
    const [stats, setStats] = useState<Statistics | null>(null);
    const [loading, setLoaing] = useState(true);

    useEffect(() => {
        const loadState = async () => {
            try {
                const data = await adminApi.getStatistics();
                setStats(data);
            } catch (e) {
                console.error('Ошибка загрузки статистики ', e);
            } finally {
                setLoaing(false);
            }
        };
        loadState();
    }, []);

    if (loading) return <div>Загрузка црфр...</div>

    return (
        <div className={style.container}>
            <h2 style={{ color: '#123C69', marginBottom: '30px'}}>Общая статистика</h2>

            <div className={style.grid1}>
                <div className={style.statCardItem}>
                    <Users size={32} color={'#AC3B61'} />
                    <span className={style.statValue}>{stats?.totalUsers || 0}</span>
                    <span className={style.statLabel}>Пользователей</span>
                </div>

                <div className={style.statCardItem}>
                    <Utensils size={32} color={'#AC3B61'} />
                    <span className={style.statValue}>{stats?.totalRecipes || 0}</span>
                    <span className={style.statLabel}>Всего рецептов</span>
                </div>
            </div>

            <div className={style.grid2}>
                <div className={style.statCardItem}>
                    <Soup size={32} color={'#AC3B61'} />
                    {stats?.popularCategoriesValue.map(category => (
                        <><span className={style.statValueItem}>{category.categoryValueName || 0}   -
                            {category.recipeCount || 0}</span></>
                    ))}
                    <span className={style.statLabel}>Популярные категории</span>
                </div>

                <div className={style.statCardItem}>
                    {/*<UserRoundCog size={32} color={'#AC3B61'} />*/}
                    <ChefHat size={32} color={'#AC3B61'} />
                    {stats?.topAuthors.map(author => (
                        <><span className={style.statValueItem}>{author.username || 0}   -
                            {author.recipeCount || 0}</span></>
                    ))}
                    <span className={style.statLabel}>Популярные авторы</span>
                </div>
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

        </div>
    )
};

export default AdminStatistics;