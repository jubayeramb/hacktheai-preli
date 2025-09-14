import express from 'express';
import { members, books, transactions, reservations } from '../models/storage.js';
import { generateReservationId } from '../utils/helpers.js';

const router = express.Router();

// PROBLEM 14: POST /api/reservations - Complex book reservation system with priority queue
router.post('/', (req, res) => {
  const {
    member_id,
    book_id,
    reservation_type = 'standard',
    preferred_pickup_date,
    max_wait_days = 14,
    notification_preferences = {},
    group_reservation = {},
    special_requests = {},
    payment_info = {}
  } = req.body;

  // Validation
  const validationErrors = [];

  if (!member_id || !book_id) {
    return res.status(400).json({
      message: "member_id and book_id are required"
    });
  }

  // Check if member exists
  if (!members.has(member_id)) {
    validationErrors.push({
      field: "member_id",
      error: "member_not_found",
      details: `Member with id ${member_id} does not exist`
    });
  }

  // Check if book exists
  if (!books.has(book_id)) {
    validationErrors.push({
      field: "book_id", 
      error: "book_not_found",
      details: `Book with id ${book_id} does not exist`
    });
  }

  // Check for existing active reservations for this member
  const memberReservations = Array.from(reservations.values()).filter(r => 
    r.member_id === member_id && r.reservation_status !== 'expired' && r.reservation_status !== 'fulfilled'
  );

  if (memberReservations.length >= 3) {
    validationErrors.push({
      field: "member_id",
      error: "member_has_active_reservation",
      details: `Member already has ${memberReservations.length} active reservations (limit: 2)`
    });
  }

  // Check if book is being processed (simulate)
  const book = books.get(book_id);
  if (book && Math.random() < 0.1) { // 10% chance book is being processed
    validationErrors.push({
      field: "book_id",
      error: "book_not_available_for_reservation", 
      details: "Book is currently being processed for return"
    });
  }

  // Check preferred pickup date conflicts (simulate library closure)
  if (preferred_pickup_date) {
    const pickupDate = new Date(preferred_pickup_date);
    const dayOfWeek = pickupDate.getDay();
    if (dayOfWeek === 0) { // Sunday
      validationErrors.push({
        field: "preferred_pickup_date",
        error: "date_conflict",
        details: "Requested date conflicts with library closure"
      });
    }
  }

  // If there are validation errors, return them
  if (validationErrors.length > 0) {
    return res.status(400).json({
      error: "reservation_conflict",
      message: "Multiple complex validation failures detected",
      details: {
        validation_errors: validationErrors,
        suggested_alternatives: {
          alternative_books: [book_id + 1, book_id + 2, book_id + 3].filter(id => books.has(id)),
          alternative_dates: [
            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          ],
          upgrade_options: ["premium_reservation", "group_reservation"]
        },
        queue_impact: {
          estimated_wait_time: "7-10 days",
          queue_position_if_accepted: 12
        }
      }
    });
  }

  // Calculate priority score
  const member = members.get(member_id);
  const memberHistory = Array.from(transactions.values()).filter(t => t.member_id === member_id);
  const borrowingFrequency = memberHistory.length / 12; // Assume 12 months
  const returnPunctuality = memberHistory.filter(t => t.status === 'returned').length / Math.max(memberHistory.length, 1);
  
  let priorityScore = 5.0; // Base score
  priorityScore += Math.min(borrowingFrequency * 2, 2); // Up to 2 points for frequency
  priorityScore += returnPunctuality * 2; // Up to 2 points for punctuality
  
  if (reservation_type === 'premium') priorityScore += 1;
  if (special_requests.academic_priority) priorityScore += 0.5;
  
  // Calculate queue position
  const bookReservations = Array.from(reservations.values()).filter(r => 
    r.book_id === book_id && r.reservation_status !== 'expired' && r.reservation_status !== 'fulfilled'
  );
  let queuePosition = bookReservations.length + 1;

  // Sort existing reservations by priority to determine actual position
  bookReservations.sort((a, b) => b.priority_score - a.priority_score);
  for (let i = 0; i < bookReservations.length; i++) {
    if (priorityScore > bookReservations[i].priority_score) {
      queuePosition = i + 1;
      break;
    }
  }

  // Create reservation
  const reservation_id = generateReservationId();
  const created_at = new Date().toISOString();
  const expires_at = new Date(Date.now() + max_wait_days * 24 * 60 * 60 * 1000).toISOString();
  
  const estimatedAvailability = new Date(Date.now() + queuePosition * 3 * 24 * 60 * 60 * 1000); // 3 days per position
  
  const reservation = {
    reservation_id,
    member_id,
    book_id,
    book_title: book?.title || "Unknown",
    reservation_status: queuePosition === 1 ? "confirmed" : "queued",
    queue_position: queuePosition,
    estimated_availability_date: estimatedAvailability.toISOString(),
    priority_score: Math.round(priorityScore * 10) / 10,
    reservation_details: {
      created_at,
      expires_at,
      pickup_window_start: preferred_pickup_date || estimatedAvailability.toISOString(),
      pickup_window_end: new Date(estimatedAvailability.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      reservation_type,
      fee_paid: reservation_type === 'premium' ? (payment_info.premium_fee || 5.00) : 0
    },
    queue_analytics: {
      total_in_queue: bookReservations.length + 1,
      avg_wait_time_days: Math.round((queuePosition * 3 + Math.random() * 4) * 10) / 10,
      queue_movement_rate: "moderate",
      cancellation_rate: 0.15
    },
    member_priority_factors: {
      borrowing_frequency: Math.round(borrowingFrequency * 10) / 10,
      return_punctuality: Math.round(returnPunctuality * 10) / 10,
      membership_tier: member.age >= 65 ? "senior" : member.age >= 18 ? "adult" : "youth",
      special_circumstances: Object.keys(special_requests).filter(key => special_requests[key]),
      loyalty_score: Math.round((borrowingFrequency * 3 + returnPunctuality * 5) * 10) / 10
    },
    notifications_scheduled: [
      {
        type: "queue_position_update",
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        type: "availability_alert", 
        scheduled_for: estimatedAvailability.toISOString()
      }
    ],
    conflict_resolution: {
      simultaneous_requests: Math.floor(Math.random() * 3),
      resolution_method: "priority_score",
      competing_members: Array.from(members.keys()).filter(id => id !== member_id).slice(0, 2)
    }
  };

  // Store reservation
  reservations.set(reservation_id, reservation);

  res.status(201).json(reservation);
});

export default router;
