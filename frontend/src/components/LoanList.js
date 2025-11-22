import React, { useState, useEffect } from 'react';
import loanService from '../services/loanService';
import './LoanList.css';

const LoanList = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLoans();
  }, [filter]);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (filter === 'overdue') {
        response = await loanService.getOverdueLoans();
      } else {
        response = await loanService.getAllLoans();
      }
      setLoans(response.data);
    } catch (err) {
      setError('Помилка завантаження позик');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async (loanId) => {
    try {
      await loanService.returnBook(loanId);
      fetchLoans();
      alert('Книга успішно повернена');
    } catch (err) {
      alert('Помилка при поверненні книги');
      console.error(err);
    }
  };

  const handleRenewLoan = async (loanId) => {
    try {
      await loanService.renewLoan(loanId);
      fetchLoans();
      alert('Позику успішно продовжено');
    } catch (err) {
      alert('Помилка при продовженні позики');
      console.error(err);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'Активна';
      case 'RETURNED':
        return 'Повернена';
      case 'OVERDUE':
        return 'Прострочена';
      case 'LOST':
        return 'Загублена';
      default:
        return status;
    }
  };

  return (
    <div className="loan-list-container">
      <h1>Позики книг</h1>

      <div className="filter-bar">
        <button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'active' : ''}
        >
          Всі позики
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={filter === 'overdue' ? 'active' : ''}
        >
          Прострочені
        </button>
      </div>

      {loading && <div className="loading">Завантаження...</div>}
      {error && <div className="error">{error}</div>}

      <div className="loans-list">
        {loans.map((loan) => (
          <div key={loan.id} className={`loan-card ${loan.status.toLowerCase()}`}>
            <div className="loan-header">
              <h3>{loan.bookTitle}</h3>
              <span className={`loan-status ${loan.status.toLowerCase()}`}>
                {getStatusText(loan.status)}
              </span>
            </div>

            <div className="loan-details">
              <p><strong>Користувач:</strong> {loan.username}</p>
              <p><strong>Дата позики:</strong> {new Date(loan.loanDate).toLocaleDateString('uk-UA')}</p>
              <p><strong>Термін повернення:</strong> {new Date(loan.dueDate).toLocaleDateString('uk-UA')}</p>
              {loan.returnDate && (
                <p><strong>Дата повернення:</strong> {new Date(loan.returnDate).toLocaleDateString('uk-UA')}</p>
              )}
              {loan.fineAmount > 0 && (
                <p className="fine"><strong>Штраф:</strong> {loan.fineAmount} грн</p>
              )}
              {loan.notes && (
                <p><strong>Примітки:</strong> {loan.notes}</p>
              )}
            </div>

            {loan.status === 'ACTIVE' && (
              <div className="loan-actions">
                <button onClick={() => handleReturnBook(loan.id)} className="return-button">
                  Повернути книгу
                </button>
                <button onClick={() => handleRenewLoan(loan.id)} className="renew-button">
                  Продовжити позику
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {loans.length === 0 && !loading && (
        <div className="no-results">Позики не знайдено</div>
      )}
    </div>
  );
};

export default LoanList;
