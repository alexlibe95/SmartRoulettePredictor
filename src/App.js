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
  const [totalProfit, setTotalProfit] = useState(0);
  const [riskLevel, setRiskLevel] = useState('low');

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
    setGameStarted(true);
    setRound(1);
    setGameHistory([]);
    setConsecutiveLosses(0);
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

  const recordResult = (won, customBetAmount = null) => {
    const newHistory = [...gameHistory];
    const betAmount = customBetAmount || currentBet;
    
    if (won) {
      const winAmount = betAmount;
      setCurrentMoney(currentMoney + winAmount);
      setTotalProfit(totalProfit + winAmount);
      setConsecutiveLosses(0);
      setCurrentBet(parseFloat(initialBet)); // Reset to initial bet
      
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
        previousLosses: consecutiveLosses
      });
    } else {
      setCurrentMoney(currentMoney - betAmount);
      setTotalProfit(totalProfit - betAmount);
      setConsecutiveLosses(consecutiveLosses + 1);
      setCurrentBet(currentBet * 2); // Double the bet (Martingale)
      
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
        previousLosses: consecutiveLosses
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

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includeGreen}
                  onChange={(e) => setIncludeGreen(e.target.checked)}
                />
                <span className="checkmark"></span>
                Include Green (0/00) in Strategy
              </label>
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
            <div className="grid grid-3 mb-4">
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

                {/* Option 1: Very Minimal - Just text */}
                <div className="risk-minimal-1" style={{display: 'none'}}>
                  <p>Rounds left: <strong className="rounds-number">{maxPossibleLosses}</strong></p>
                </div>

                {/* Option 2: Simple card with icon */}
                <div className="risk-minimal-2">
                  <AlertTriangle size={20} />
                  <span>Safe for <strong className={`rounds-number-colored ${
                    maxPossibleLosses > 6 ? 'safe' : 
                    maxPossibleLosses >= 4 ? 'warning' : 'danger'
                  }`}>{maxPossibleLosses}</strong> more losses</span>
                </div>

                {/* Option 3: Clean badge style */}
                <div className="risk-minimal-3" style={{display: 'none'}}>
                  <div className="rounds-badge">
                    {maxPossibleLosses} rounds left
                  </div>
                </div>

                {/* Option 4: Inline with bet amount */}
                <div className="risk-minimal-4" style={{display: 'none'}}>
                  <p className="bet-amount">Bet: ${currentBet.toFixed(2)}</p>
                  <p className="rounds-info">({maxPossibleLosses} safe rounds)</p>
                </div>
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