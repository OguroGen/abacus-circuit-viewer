// LIFFの初期化処理

// 環境変数からLIFF IDを読み込む
const LIFF_ID = import.meta.env.VITE_LIFF_ID;

export const initializeLiff = async () => {
  const liff = await import('@line/liff');
  
  try {
    await liff.default.init({ liffId: LIFF_ID });
    return liff.default;
  } catch (error) {
    console.error('LIFFの初期化に失敗しました: ', error);
    throw error;
  }
};
