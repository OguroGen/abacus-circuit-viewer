import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeLiff } from '@services/liff';
import { supabase } from '@services/supabase';
import CircuitSelector from '@components/CircuitSelector';
import StudentResult from '@components/StudentResult';
import CircuitRanking from '@components/CircuitRanking';
import './App.css';

const LIFF_ID = process.env.VITE_LIFF_ID; // .envからLIFF IDを読み込む

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);

  useEffect(() => {
    // LIFFの初期化
    const initLiff = async () => {
      try {
        const liffObject = await initializeLiff(LIFF_ID);
        
        if (liffObject.isLoggedIn()) {
          setIsLoggedIn(true);
          const profile = await liffObject.getProfile();
          setProfile(profile);
          setUserId(profile.userId);
          
          // Supabaseからユーザーに関連する子どもの情報を取得
          fetchChildren(profile.userId);
        } else {
          liffObject.login();
        }
      } catch (error) {
        console.error('LIFFの初期化に失敗しました: ', error);
      } finally {
        setLoading(false);
      }
    };

    initLiff();
  }, []);

  // 子どもの情報を取得
  const fetchChildren = async (lineUserId) => {
    try {
      // LINE IDからユーザー情報を取得
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('line_user_id', lineUserId)
        .single();

      if (userError) throw userError;

      // ユーザーIDから関連する子どもを取得
      const { data: relationships, error: relError } = await supabase
        .from('relationships')
        .select('seito_id')
        .eq('parent_id', users.id);

      if (relError) throw relError;
      
      if (relationships && relationships.length > 0) {
        // 子どもの詳細情報を取得
        const seitoIds = relationships.map(rel => rel.seito_id);
        const { data: students, error: studentError } = await supabase
          .from('students')
          .select('*')
          .in('seito_id', seitoIds);

        if (studentError) throw studentError;
        setChildren(students);
      }
    } catch (error) {
      console.error('子どもの情報取得に失敗しました: ', error);
    }
  };

  if (loading) {
    return <div className="loading">ローディング中...</div>;
  }

  if (!isLoggedIn) {
    return <div className="error">ログインしてください</div>;
  }

  // Vercelにデプロイされているかどうかを判断
  const isVercel = import.meta.env.VITE_VERCEL === '1';
  
  return (
    <Router basename={isVercel ? '/' : '/liff-app/abacus-circuit-viewer'}>
      <div className="App">
        <Routes>
          {/* 月（回）選択画面を最初に表示 */}
          <Route path="/" element={<CircuitSelector children={children} />} />
          {/* 個別成績表示画面 */}
          <Route path="/student/:seitoId/:round" element={<StudentResult />} />
          {/* クラス別順位表示画面 */}
          <Route path="/ranking/:round/:classLevel" element={<CircuitRanking />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
