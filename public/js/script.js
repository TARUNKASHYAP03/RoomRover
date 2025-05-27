// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
    'use strict'
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')
  
    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }
  
        form.classList.add('was-validated')
      }, false)
    })
  })();

  // Booking form date validation
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const bookingForm = document.getElementById('bookingForm');

  startDateInput.addEventListener('change', function() {
    // Set checkout min to one day after check-in
    if (startDateInput.value) {
      const start = new Date(startDateInput.value);
      const minEnd = new Date(start);
      minEnd.setDate(minEnd.getDate() + 1);
      endDateInput.min = minEnd.toISOString().split('T')[0];
      // If endDate is before new min, reset it
      if (endDateInput.value && endDateInput.value <= startDateInput.value) {
        endDateInput.value = '';
      }
    }
  });

  bookingForm.addEventListener('submit', function(e) {
    if (startDateInput.value && endDateInput.value) {
      if (endDateInput.value <= startDateInput.value) {
        e.preventDefault();
        alert('Check-out date must be after check-in date.');
      }
    }
  });

  function cancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking?')) return;
  fetch(`/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json'
    }
  })
  .then(async res => {
    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      throw new Error('Unexpected server response');
    }
    if (res.ok) {
      const tripCard = document.getElementById('trip-' + bookingId);
      if (tripCard) tripCard.remove();
      alert(data.message || 'Booking cancelled');
    } else {
      throw new Error(data.error || 'Failed to cancel booking');
    }
  })
  .catch(err => alert(err.message));
}

const translations = {
  en: {
    search_anywhere: "Anywhere",
    search_anyweek: "Any week",
    search_addguests: "Add guests",
    become_host: "Become a Host",
    login: "Log in",
    signup: "Sign up",
    host_home: "Host your home",
    profile: "Profile",
    my_trips: "My Trips",
    help: "Help",
    logout: "Log out",
    welcome: "Welcome"
    // Add more keys as needed
  },
  hi: {
    search_anywhere: "कहीं भी",
    search_anyweek: "कोई भी सप्ताह",
    search_addguests: "मेहमान जोड़ें",
    become_host: "मेज़बान बनें",
    login: "लॉग इन",
    signup: "साइन अप",
    host_home: "अपना घर सूचीबद्ध करें",
    profile: "प्रोफ़ाइल",
    my_trips: "मेरी यात्राएँ",
    help: "सहायता",
    logout: "लॉग आउट",
    welcome: "स्वागत है"
    // Add more keys as needed
  }
};

function setLanguage(lang) {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
  // Update label in navbar
  document.getElementById('current-lang-label').textContent = lang === 'en' ? 'English' : 'हिन्दी';
  localStorage.setItem("roomrover_lang", lang);
}

document.addEventListener('DOMContentLoaded', function() {
  // Dropdown click
  document.querySelectorAll('.lang-option').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var lang = btn.getAttribute('data-lang');
      setLanguage(lang);
    });
  });
  // On load, set saved or default language
  const savedLang = localStorage.getItem("roomrover_lang") || "en";
  setLanguage(savedLang);
});