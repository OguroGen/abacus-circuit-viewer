// LIFFの初期化処理

export const initializeLiff = async (liffId) => {
  const liff = await import('@line/liff');
  
  try {
    await liff.default.init({ liffId });
    return liff.default;
  } catch (error) {
    console.error('LIFFの初期化に失敗しました: ', error);
    throw error;
  }
};
