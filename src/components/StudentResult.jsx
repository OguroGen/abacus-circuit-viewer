import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@services/supabase';
import './StudentResult.css';

function StudentResult() {
  const { seitoId, round } = useParams();
  const [result, setResult] = useState(null);
  const [eventInfo, setEventInfo] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [classResults, setClassResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayRound, setDisplayRound] = useState(round);
  const [displayResult, setDisplayResult] = useState(null);
  const [displayEventInfo, setDisplayEventInfo] = useState(null);
  const [displayClassResults, setDisplayClassResults] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let targetRound = round;
        
        // 'latest'パラメータの場合は最新の回を取得
        if (round === 'latest') {
          const { data: latestCircuit, error: latestError } = await supabase
            .from('abacus_circuit_events')
            .select('circuit_round')
            .order('circuit_round', { ascending: false })
            .limit(1)
            .single();
            
          if (latestError) throw latestError;
          targetRound = latestCircuit.circuit_round;
          setDisplayRound(targetRound);
        }
        
        // 1. 選択したラウンドの結果取得
        const { data: resultData, error: resultError } = await supabase
          .from('abacus_circuit_results')
          .select('*')
          .eq('seito_id', seitoId)
          .eq('circuit_round', targetRound)
          .single();

        if (resultError && resultError.code !== 'PGRST116') {
          throw resultError;
        }

        // 2. イベント情報の取得
        const { data: eventData, error: eventError } = await supabase
          .from('abacus_circuit_events')
          .select('*')
          .eq('circuit_round', targetRound)
          .single();

        if (eventError) throw eventError;

        // 3. 生徒情報の取得
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('seito_id', seitoId)
          .single();

        if (studentError) throw studentError;

        // 4. 同じクラスの結果を取得して順位を計算するためのデータ
        let classData = [];
        if (resultData) {
          const { data: fetchedClassData, error: classError } = await supabase
            .from('abacus_circuit_results')
            .select('*')
            .eq('circuit_round', targetRound)
            .eq('class_level', resultData.class_level)
            .order('total_score', { ascending: false });

          if (classError) throw classError;
          classData = fetchedClassData;
          setClassResults(classData);
        }

        // 5. 過去の結果を取得（直近6回分）
        const { data: historyData, error: historyError } = await supabase
          .from('abacus_circuit_results')
          .select(`
            *,
            abacus_circuit_events (
              event_date,
              circuit_round
            )
          `)
          .eq('seito_id', seitoId)
          .order('circuit_round', { ascending: false })
          .limit(6);

        if (historyError) throw historyError;

        setResult(resultData);
        setEventInfo(eventData);
        setStudentInfo(studentData);
        setHistory(historyData);
        
        // 初期表示用のデータをセット
        setDisplayResult(resultData);
        setDisplayEventInfo(eventData);
        setDisplayClassResults(classData);
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError('データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [seitoId, round]);

  // 過去の成績をタップした時の処理
  const handleHistoryClick = async (historyItem) => {
    // すでに表示中の回数と同じ場合は何もしない
    if (displayRound == historyItem.circuit_round) return;
    
    try {
      setLoading(true);
      
      // 1. イベント情報の取得
      const { data: eventData, error: eventError } = await supabase
        .from('abacus_circuit_events')
        .select('*')
        .eq('circuit_round', historyItem.circuit_round)
        .single();

      if (eventError) throw eventError;
      
      // 2. 同じクラスの結果を取得して順位を計算するためのデータ
      const { data: classData, error: classError } = await supabase
        .from('abacus_circuit_results')
        .select('*')
        .eq('circuit_round', historyItem.circuit_round)
        .eq('class_level', historyItem.class_level)
        .order('total_score', { ascending: false });

      if (classError) throw classError;
      
      // 表示データを更新
      setDisplayRound(historyItem.circuit_round);
      setDisplayResult(historyItem);
      setDisplayEventInfo(eventData);
      setDisplayClassResults(classData);
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // 順位を計算する関数
  const calculateRank = (studentScore, allResults) => {
    if (!studentScore || !allResults || allResults.length === 0) return null;
    
    // 合計点でソート
    const sortedResults = [...allResults].sort((a, b) => b.total_score - a.total_score);
    
    // 自分の順位を見つける
    const rank = sortedResults.findIndex(item => item.seito_id === seitoId) + 1;
    return rank;
  };

  // クラスレベルを表示用に変換
  const formatClassLevel = (level) => {
    switch (level) {
      case 0: return 'F0';
      case 1: return 'F1';
      case 2: return 'F2';
      default: return '不明';
    }
  };

  if (loading) {
    return <div className="loading">データを読み込み中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // 結果が見つからない場合
  if (!result && !history.length) {
    return (
      <div className="no-result-container">
        <h2>結果が見つかりません</h2>
        <p>第{round}回のアバカスサーキットの結果はまだ登録されていないか、参加されていません。</p>
        <Link to="/" className="back-button">戻る</Link>
      </div>
    );
  }

  // 表示する結果がない場合は履歴から最初のものを表示
  const currentDisplayResult = displayResult || (history.length > 0 ? history[0] : null);
  const currentDisplayEventInfo = displayEventInfo || (history.length > 0 && history[0].abacus_circuit_events ? { event_date: history[0].abacus_circuit_events.event_date } : null);
  
  // 順位を計算
  const rank = calculateRank(currentDisplayResult, displayClassResults);

  return (
    <div className="result-container">
      <h2>{studentInfo?.family_name} {studentInfo?.given_name}さんの成績</h2>
      <div className="event-info">
        <h3>第{displayRound}回 アバカスサーキット</h3>
        <p>開催: {currentDisplayEventInfo && formatDate(currentDisplayEventInfo.event_date)}</p>
        <p>クラス: {formatClassLevel(currentDisplayResult?.class_level)}</p>
      </div>

      <div className="score-card">
        <div className="score-item">
          <h4>かけ算</h4>
          <div className="score">{currentDisplayResult?.multiplication_score}</div>
        </div>
        <div className="score-item">
          <h4>わり算</h4>
          <div className="score">{currentDisplayResult?.division_score}</div>
        </div>
        <div className="score-item">
          <h4>見取算</h4>
          <div className="score">{currentDisplayResult?.mental_calculation_score}</div>
        </div>
        <div className="score-item total">
          <h4>合計</h4>
          <div className="score">{currentDisplayResult?.total_score}</div>
        </div>
      </div>

      <div className="rank-info">
        <h3>順位情報</h3>
        <p className="rank">第 {rank || '-'} 位 / {displayClassResults.length || '-'}人中</p>
        <Link 
          to={`/ranking/${displayRound}/${currentDisplayResult?.class_level}`} 
          className="ranking-button"
        >
          {formatClassLevel(currentDisplayResult?.class_level)}クラスの順位表を見る
        </Link>
      </div>

      <div className="history-section">
        <h3>過去の成績</h3>
        
        {/* クラスレベルごとに成績をグループ化 */}
        {(() => {
          // クラスレベルごとにグループ化
          const groupedByClass = history.reduce((acc, item) => {
            const classLevel = item.class_level;
            if (!acc[classLevel]) {
              acc[classLevel] = [];
            }
            acc[classLevel].push(item);
            return acc;
          }, {});
          
          // クラスレベルの順序（F2, F1, F0の順）
          const classOrder = [2, 1, 0];
          
          return (
            <>
              {classOrder.map(classLevel => {
                const classItems = groupedByClass[classLevel];
                if (!classItems || classItems.length === 0) return null;
                
                return (
                  <div key={classLevel} className="history-class-section">
                    <h4>{formatClassLevel(classLevel)}クラスの成績</h4>
                    <div className="history-table">
                      <table>
                        <thead>
                          <tr>
                            <th>回</th>
                            <th>開催月</th>
                            <th>かけ算</th>
                            <th>わり算</th>
                            <th>見取算</th>
                            <th>合計</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classItems.map((item) => (
                            <tr 
                              key={item.id} 
                              className={item.circuit_round == displayRound ? 'current-round' : ''}
                              onClick={() => handleHistoryClick(item)}
                            >
                              <td>{item.circuit_round}</td>
                              <td>{item.abacus_circuit_events ? formatDate(item.abacus_circuit_events.event_date) : ''}</td>
                              <td>{item.multiplication_score}</td>
                              <td>{item.division_score}</td>
                              <td>{item.mental_calculation_score}</td>
                              <td>{item.total_score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </>
          );
        })()}
      </div>

      <Link to="/" className="back-button">戻る</Link>
    </div>
  );
}

// 日付をフォーマットする関数
function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

export default StudentResult;
