import React, { useState, useEffect } from 'react';
import { DollarSign, Target, TrendingUp, AlertTriangle, RotateCcw } from 'lucide-react';
import './App.css';

function App() {
  const [bankroll, setBankroll] = useState('');
  const [initialBet, setInitialBet] = useState('');
  const [includeGreen, setIncludeGreen] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentBet, setCurrentBet] = useState(0);
  const [currentMoney, setCurrentMoney] = useState(0);
  const [round, setRound] = useState(1);
  const [strategy, setStrategy] = useState('red');
  const [gameHistory, setGameHistory] = useState([]);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [riskLevel, setRiskLevel] = useState('low');
  const [isProgressiveBetting, setIsProgressiveBetting] = useState(true);
  const [baseBet, setBaseBet] = useState(0);

  // Calculate maximum consecutive losses before bankruptcy
  const calculateMaxLosses = (money, bet) => {
    let currentBet = bet;
    let remainingMoney = money;
    let losses = 0;

    while (remainingMoney >= currentBet) {
      remainingMoney -= currentBet;
      losses++;
      currentBet *= 2; // Martingale progression
    }

    return losses;
  };

  // Calculate risk level based on current situation
  useEffect(() => {
    if (gameStarted) {
      const maxLosses = calculateMaxLosses(currentMoney, currentBet);
      if (maxLosses <= 2) {
        setRiskLevel('high');
      } else if (maxLosses <= 5) {
        setRiskLevel('medium');
      } else {
        setRiskLevel('low');
      }
    }
  }, [currentMoney, currentBet, gameStarted]);

  const startGame = () => {
    if (!bankroll || !initialBet) {
      alert('Please enter both bankroll and initial bet amounts');
      return;
    }

    const money = parseFloat(bankroll);
    const bet = parseFloat(initialBet);

    if (bet > money) {
      alert('Initial bet cannot be larger than your bankroll');
      return;
    }

    setCurrentMoney(money);
    setCurrentBet(bet);
    setBaseBet(bet); // Store the original bet amount
    setGameStarted(true);
    setRound(1);
    setGameHistory([]);
    setConsecutiveLosses(0);
    setConsecutiveWins(0);
    setTotalProfit(0);
    
    // Set initial strategy
    const generateInitialStrategy = () => {
      if (includeGreen) {
        const randomNum = Math.random();
        if (randomNum < 0.45) return 'red';
        if (randomNum < 0.90) return 'black';
        return 'green';
      } else {
        return Math.random() > 0.5 ? 'red' : 'black';
      }
    };
    setStrategy(generateInitialStrategy());
  };

  const resetGame = () => {
    setGameStarted(false);
    setBankroll('');
    setInitialBet('');
    setCurrentMoney(0);
    setCurrentBet(0);
    setRound(1);
    setGameHistory([]);
    setConsecutiveLosses(0);
    setTotalProfit(0);
    setRiskLevel('low');
  };

  // Fibonacci sequence for progressive betting
  const getFibonacci = (n) => {
    const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
    return fib[Math.min(n - 1, fib.length - 1)] || 1;
  };

  // Smart Progressive betting with balanced options
  const calculateNextBetAmount = (isWin, currentWinStreak, currentBetAmount, baseBetAmount, currentLossStreak = 0) => {
    if (!isProgressiveBetting) {
      // Standard Martingale
      return isWin ? baseBetAmount : currentBetAmount * 2;
    }

    if (isWin) {
      // Progressive betting during winning streaks with balanced progression
      const newWinStreak = currentWinStreak + 1;
      
      // Create more balanced betting options
      const random = Math.random();
      
      if (newWinStreak === 1) {
        // First win: modest increase
        return random > 0.4 ? baseBetAmount * 2 : baseBetAmount;
      } else if (newWinStreak === 2) {
        // Second win: choose between 1x, 2x, or 3x
        if (random > 0.7) return baseBetAmount * 3;
        if (random > 0.3) return baseBetAmount * 2;
        return baseBetAmount;
      } else if (newWinStreak === 3) {
        // Third win: choose between 1x, 2x, 3x, or 4x
        if (random > 0.8) return baseBetAmount * 4;
        if (random > 0.6) return baseBetAmount * 3;
        if (random > 0.3) return baseBetAmount * 2;
        return baseBetAmount;
      } else if (newWinStreak <= 6) {
        // Mid-streak: choose between 1x, 2x, 3x, 4x, or 5x
        if (random > 0.85) return baseBetAmount * 5;
        if (random > 0.7) return baseBetAmount * 4;
        if (random > 0.5) return baseBetAmount * 3;
        if (random > 0.25) return baseBetAmount * 2;
        return baseBetAmount;
      } else {
        // Long streak: more conservative, choose between 1x, 2x, 3x, or 6x
        if (random > 0.9) return baseBetAmount * 6; // rare big bet
        if (random > 0.7) return baseBetAmount * 3;
        if (random > 0.4) return baseBetAmount * 2;
        return baseBetAmount; // often secure profits
      }
    } else {
      // Loss: Check if we're coming from a winning streak
      if (currentWinStreak > 0) {
        // Coming from winning streak - reset to base bet for safety
        return baseBetAmount;
      } else {
        // Already in losing streak - double the bet (Martingale)
        return currentBetAmount * 2;
      }
    }
  };

  const recordResult = (won, customBetAmount = null) => {
    const newHistory = [...gameHistory];
    const betAmount = customBetAmount || currentBet;
    
    if (won) {
      const winAmount = betAmount;
      const newWinStreak = consecutiveWins + 1;
      
      setCurrentMoney(currentMoney + winAmount);
      setTotalProfit(totalProfit + winAmount);
      setConsecutiveLosses(0);
      setConsecutiveWins(newWinStreak);
      
      // Calculate next bet using smart progression
      const nextBet = calculateNextBetAmount(true, consecutiveWins, currentBet, baseBet, consecutiveLosses);
      setCurrentBet(nextBet);
      
      newHistory.push({
        round,
        bet: betAmount,
        result: 'win',
        strategy,
        profit: winAmount,
        balance: currentMoney + winAmount,
        previousBet: currentBet,
        previousMoney: currentMoney,
        previousProfit: totalProfit,
        previousLosses: consecutiveLosses,
        previousWins: consecutiveWins,
        winStreak: newWinStreak,
        nextBet: nextBet
      });
    } else {
      setCurrentMoney(currentMoney - betAmount);
      setTotalProfit(totalProfit - betAmount);
      setConsecutiveLosses(consecutiveLosses + 1);
      setConsecutiveWins(0); // Reset win streak
      
      // Calculate next bet using smart progression for losses too
      const nextBet = calculateNextBetAmount(false, consecutiveWins, currentBet, baseBet, consecutiveLosses);
      setCurrentBet(nextBet);
      
      newHistory.push({
        round,
        bet: betAmount,
        result: 'loss',
        strategy,
        profit: -betAmount,
        balance: currentMoney - betAmount,
        previousBet: currentBet,
        previousMoney: currentMoney,
        previousProfit: totalProfit,
        previousLosses: consecutiveLosses,
        previousWins: consecutiveWins,
        winStreak: 0,
        nextBet: nextBet
      });
    }

    setGameHistory(newHistory);
    setRound(round + 1);
    
    // Change strategy after each round for variety
    const generateNewStrategy = () => {
      if (includeGreen) {
        const randomNum = Math.random();
        if (randomNum < 0.45) return 'red';
        if (randomNum < 0.90) return 'black';
        return 'green';
      } else {
        return Math.random() > 0.5 ? 'red' : 'black';
      }
    };
    setStrategy(generateNewStrategy());
  };

  const playWithRemainingBalance = () => {
    // Play with whatever money is left
    const remainingMoney = currentMoney;
    recordResult(false, remainingMoney); // Assume loss for now, user can undo if they won
  };

  const addMoneyToContinue = () => {
    // Calculate how much money is needed
    const moneyNeeded = currentBet - currentMoney;
    // Add the required amount to continue
    setCurrentMoney(currentBet);
    // Note: This doesn't affect total profit since it's additional investment
  };

  const undoLastRound = () => {
    if (gameHistory.length === 0) return;
    
    const lastRound = gameHistory[gameHistory.length - 1];
    
    // Restore previous state
    setCurrentMoney(lastRound.previousMoney);
    setTotalProfit(lastRound.previousProfit);
    setConsecutiveLosses(lastRound.previousLosses);
    setConsecutiveWins(lastRound.previousWins || 0);
    setCurrentBet(lastRound.previousBet);
    setRound(round - 1);
    
    // Remove last entry from history
    const newHistory = gameHistory.slice(0, -1);
    setGameHistory(newHistory);
    
    // Set strategy back (this is approximate since we changed it randomly)
    setStrategy(lastRound.strategy);
  };

  const maxPossibleLosses = gameStarted ? calculateMaxLosses(currentMoney, currentBet) : 0;

  return (
    <div className="App">
      <div className="container">
        <header className="text-center mb-4">
          <h1 className="app-title">
            <Target className="icon" />
            Smart Roulette Predictor
          </h1>
          <p className="app-subtitle">Intelligent betting strategy to protect your wealth</p>
        </header>

        {!gameStarted ? (
          <div className="card setup-card">
            <h2 className="mb-3">Setup Your Game</h2>
            
            <div className="grid grid-2">
              <div className="form-group">
                <label>
                  <DollarSign className="inline-icon" />
                  Total Bankroll ($)
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={bankroll}
                  onChange={(e) => setBankroll(e.target.value)}
                  placeholder="Enter your total money"
                  min="1"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>
                  <TrendingUp className="inline-icon" />
                  Initial Bet ($)
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={initialBet}
                  onChange={(e) => setInitialBet(e.target.value)}
                  placeholder="Enter your starting bet"
                  min="0.01"
                  step="0.01"
                />
              </div>
            </div>

            <div className="bet-suggestions bet-suggestions-full-width">
              {bankroll ? (
                <>
                  <p className="suggestions-label">💡 Suggested bets:</p>
                  <div className="suggestion-buttons">
                    <button 
                      className="suggestion-btn low-risk"
                      onClick={() => setInitialBet((parseFloat(bankroll) * 0.01).toFixed(2))}
                      title="1% of bankroll - Very safe, many rounds possible"
                    >
                      Low Risk: ${(parseFloat(bankroll) * 0.01).toFixed(2)}
                    </button>
                    <button 
                      className="suggestion-btn normal-risk"
                      onClick={() => setInitialBet((parseFloat(bankroll) * 0.025).toFixed(2))}
                      title="2.5% of bankroll - Balanced risk/reward"
                    >
                      Normal: ${(parseFloat(bankroll) * 0.025).toFixed(2)}
                    </button>
                    <button 
                      className="suggestion-btn high-risk"
                      onClick={() => setInitialBet((parseFloat(bankroll) * 0.05).toFixed(2))}
                      title="5% of bankroll - Higher risk, fewer safe rounds"
                    >
                      Extreme: ${(parseFloat(bankroll) * 0.05).toFixed(2)}
                    </button>
                  </div>
                </>
              ) : (
                <p className="suggestions-placeholder">Enter your bankroll to see suggested bet amounts</p>
              )}
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeGreen}
                    onChange={(e) => setIncludeGreen(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Include Green <span className="green-numbers">(0/00)</span>
                </label>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isProgressiveBetting}
                    onChange={(e) => setIsProgressiveBetting(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Smart Progressive Betting
                </label>
              </div>
            </div>

            <button 
              className="btn btn-primary btn-large"
              onClick={startGame}
            >
              Start Smart Prediction
            </button>
          </div>
        ) : (
          <div className="game-interface">
            {/* Game Stats */}
            <div className="grid grid-5 mb-4">
              <div className="stat-card">
                <h3>Current Balance</h3>
                <p className={`stat-value ${currentMoney < parseFloat(bankroll) ? 'text-danger' : 'text-success'}`}>
                  ${currentMoney.toFixed(2)}
                </p>
              </div>
              
              <div className="stat-card">
                <h3>Total Profit</h3>
                <p className={`stat-value ${totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                  ${totalProfit.toFixed(2)}
                </p>
                <p className="profit-percentage">
                  {((totalProfit / parseFloat(bankroll)) * 100).toFixed(1)}%
                </p>
              </div>
              
              <div className="stat-card">
                <h3>Win Streak {consecutiveWins > 0 ? '🔥' : ''}</h3>
                <p className={`stat-value ${consecutiveWins > 0 ? 'text-success' : 'text-warning'}`}>
                  {consecutiveWins}
                </p>
              </div>
              
              <div className="stat-card">
                <h3>Win/Loss Ratio</h3>
                {gameHistory.length > 0 ? (
                  <div>
                    <p className={`stat-value ${
                      (gameHistory.filter(g => g.result === 'win').length / gameHistory.length) >= 0.5 ? 'text-success' : 'text-danger'
                    }`}>
                      {Math.round((gameHistory.filter(g => g.result === 'win').length / gameHistory.length) * 100)}%
                    </p>
                    <p className="ratio-details">
                      {gameHistory.filter(g => g.result === 'win').length}W / {gameHistory.filter(g => g.result === 'loss').length}L
                    </p>
                  </div>
                ) : (
                  <p className="stat-value text-warning">--</p>
                )}
              </div>
              
              <div className="stat-card">
                <h3>Risk Level</h3>
                <p className={`stat-value text-${riskLevel === 'high' ? 'danger' : riskLevel === 'medium' ? 'warning' : 'success'}`}>
                  {riskLevel.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Current Round Info */}
            <div className="card current-round">
              <h2>Round {round}</h2>
              
              <div className="prediction-display">
                <div className="strategy-recommendation">
                  <h3>Recommended Bet</h3>
                  <div className={`color-choice ${strategy}`}>
                    {strategy.toUpperCase()}
                  </div>
                  <p className="bet-amount">Bet: ${currentBet.toFixed(2)}</p>
                </div>

                {/* Option 2: Simple card with icon */}
                <div className="risk-minimal-2">
                  <AlertTriangle size={20} />
                  <span>Safe for <strong className={`rounds-number-colored ${
                    maxPossibleLosses > 6 ? 'safe' : 
                    maxPossibleLosses >= 4 ? 'warning' : 'danger'
                  }`}>{maxPossibleLosses}</strong> more losses</span>
                </div>
              </div>

              {/* Full-width betting strategy info */}
              <div className="betting-strategy-container">
                {isProgressiveBetting && (
                  <div className="betting-strategy-info">
                    <p className="strategy-mode">📈 Progressive Mode</p>
                    {consecutiveWins > 0 && (
                      <div>
                        <p className="win-streak-bonus">
                          🔥 Win streak: {consecutiveWins} | Next bet: Smart progression
                        </p>
                        <p className="cycle-info">
                          {consecutiveWins <= 1 && "🎯 Modest increase options (1x-2x)"}
                          {consecutiveWins === 2 && "⚖️ Balanced choices (1x-3x)"}
                          {consecutiveWins === 3 && "🎰 More options (1x-4x)"}
                          {consecutiveWins > 3 && consecutiveWins <= 6 && "💫 Peak opportunities (1x-5x)"}
                          {consecutiveWins > 6 && "💰 Conservative with rare big bets (1x-6x)"}
                        </p>
                      </div>
                    )}
                    <p className="base-bet-info">Base bet: ${baseBet.toFixed(2)}</p>
                  </div>
                )}
                {!isProgressiveBetting && (
                  <div className="betting-strategy-info">
                    <p className="strategy-mode">🔄 Classic Martingale</p>
                    <p className="base-bet-info">Base bet: ${baseBet.toFixed(2)}</p>
                  </div>
                )}
              </div>

              {currentMoney >= currentBet ? (
                <div className="action-buttons">
                  <button 
                    className="btn btn-success"
                    onClick={() => recordResult(true)}
                  >
                    Won This Round
                  </button>
                  
                  <button 
                    className="btn btn-danger"
                    onClick={() => recordResult(false)}
                  >
                    Lost This Round
                  </button>
                </div>
              ) : (
                <div className="final-round-options">
                  <h3 className="final-round-title">Insufficient Funds</h3>
                  <p className="final-round-info">
                    You have ${currentMoney.toFixed(2)} but need ${currentBet.toFixed(2)} for the proper bet
                  </p>
                  <p className="money-needed">
                    You need <strong>${(currentBet - currentMoney).toFixed(2)} more</strong> to continue
                  </p>
                  
                  <div className="final-options-grid">
                    <div className="final-option">
                      <div className="option-content">
                        <h4>Option 1: Play with what you have</h4>
                        <p>Bet your remaining ${currentMoney.toFixed(2)} (final round)</p>
                      </div>
                      <button 
                        className="btn btn-primary"
                        onClick={playWithRemainingBalance}
                        disabled={currentMoney <= 0}
                      >
                        Bet Remaining ${currentMoney.toFixed(2)}
                      </button>
                    </div>
                    
                    <div className="final-option">
                      <div className="option-content">
                        <h4>Option 2: Add money and continue</h4>
                        <p>Add ${(currentBet - currentMoney).toFixed(2)} to your balance and play the proper bet of ${currentBet.toFixed(2)}</p>
                      </div>
                      <button 
                        className="btn btn-secondary"
                        onClick={addMoneyToContinue}
                      >
                        Add ${(currentBet - currentMoney).toFixed(2)} & Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {gameHistory.length > 0 && currentMoney >= currentBet && (
                <div className="undo-section">
                  <button 
                    className="btn btn-secondary"
                    onClick={undoLastRound}
                  >
                    <RotateCcw className="inline-icon" />
                    Undo Last Round
                  </button>
                </div>
              )}
            </div>

            {/* Game History */}
            {gameHistory.length > 0 && (
              <div className="card mt-4">
                <h3>Game History</h3>
                <div className="history-table">
                  <div className="history-header">
                    <span>Round</span>
                    <span>Strategy</span>
                    <span>Bet</span>
                    <span>Result</span>
                    <span>Profit/Loss</span>
                    <span>Balance</span>
                  </div>
                  {gameHistory.slice(-10).reverse().map((entry, index) => (
                    <div key={index} className="history-row">
                      <span>{entry.round}</span>
                      <span className={`strategy-tag ${entry.strategy}`}>
                        {entry.strategy.toUpperCase()}
                      </span>
                      <span>${entry.bet.toFixed(2)}</span>
                      <span className={`result ${entry.result}`}>
                        {entry.result.toUpperCase()}
                      </span>
                      <span className={entry.profit >= 0 ? 'text-success' : 'text-danger'}>
                        ${entry.profit.toFixed(2)}
                      </span>
                      <span>${entry.balance.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                {gameHistory.length > 10 && (
                  <p className="text-center mt-2">Showing last 10 rounds</p>
                )}
              </div>
            )}

            <div className="text-center mt-4">
              <button 
                className="btn btn-primary"
                onClick={resetGame}
              >
                <RotateCcw className="inline-icon" />
                Reset Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 