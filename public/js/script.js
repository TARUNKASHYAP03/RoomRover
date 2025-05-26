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