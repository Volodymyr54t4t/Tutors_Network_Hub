// Функція для перевірки пароля
function checkPassword(password) {
    // Відправляємо запит на сервер для перевірки пароля
    return fetch('/check-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
    })
    .then(response => response.json())
    .then(data => {
        return data.success;
    })
    .catch(error => {
        console.error('Помилка при перевірці пароля:', error);
        return false;
    });
}

// Функція для збереження статусу авторизації в localStorage
function setAuthStatus(isAuthenticated) {
    if (isAuthenticated) {
        localStorage.setItem('adminAuthenticated', 'true');
        localStorage.setItem('authTimestamp', Date.now().toString());
    } else {
        localStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('authTimestamp');
    }
}

// Функція для перевірки статусу авторизації
function checkAuthStatus() {
    const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
    const timestamp = parseInt(localStorage.getItem('authTimestamp') || '0');
    const currentTime = Date.now();
    
    // Перевіряємо, чи не минуло 24 години з моменту авторизації
    const oneDayInMs = 24 * 60 * 60 * 1000;
    if (isAuthenticated && (currentTime - timestamp) < oneDayInMs) {
        return true;
    }
    
    return false;
}

// Ініціалізація модального вікна з паролем
document.addEventListener('DOMContentLoaded', function() {
    const passwordModal = document.getElementById('passwordModal');
    const adminPassword = document.getElementById('adminPassword');
    const submitPasswordBtn = document.getElementById('submitPasswordBtn');
    const passwordError = document.getElementById('passwordError');
    
    // Перевіряємо, чи користувач вже авторизований
    if (checkAuthStatus()) {
        passwordModal.style.display = 'none';
        return;
    }
    
    // Показуємо модальне вікно з паролем
    passwordModal.style.display = 'flex';
    
    // Обробник події для кнопки входу
    submitPasswordBtn.addEventListener('click', async function() {
        const password = adminPassword.value.trim();
        
        if (!password) {
            passwordError.style.display = 'block';
            adminPassword.focus();
            return;
        }
        
        const isValid = await checkPassword(password);
        
        if (isValid) {
            setAuthStatus(true);
            passwordModal.style.display = 'none';
        } else {
            passwordError.style.display = 'block';
            adminPassword.value = '';
            adminPassword.focus();
            
            // Додаємо анімацію тряски для поля пароля
            adminPassword.classList.add('shake');
            setTimeout(() => {
                adminPassword.classList.remove('shake');
            }, 500);
        }
    });
    
    // Обробник події для натискання Enter
    adminPassword.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            submitPasswordBtn.click();
        }
    });
    
    // Приховуємо повідомлення про помилку при введенні пароля
    adminPassword.addEventListener('input', function() {
        passwordError.style.display = 'none';
    });
});