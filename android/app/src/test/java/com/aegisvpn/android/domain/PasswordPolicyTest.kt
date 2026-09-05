package com.aegisvpn.android.domain

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The password/email policy MUST mirror the backend's zod rules
 * (backend/src validation): at least 10 chars, one letter, one digit;
 * email shape enforced identically so the client never sends a request
 * the server is guaranteed to reject with 422.
 */
class PasswordPolicyTest {

    @Test
    fun passwordShorterThanTenCharactersIsRejected() {
        assertTrue(PasswordPolicy.errors("Short1a").isNotEmpty())
    }

    @Test
    fun passwordWithoutALetterIsRejected() {
        assertTrue(PasswordPolicy.errors("1234567890").isNotEmpty())
    }

    @Test
    fun passwordWithoutADigitIsRejected() {
        assertTrue(PasswordPolicy.errors("abcdefghij").isNotEmpty())
    }

    @Test
    fun compliantPasswordProducesNoProblems() {
        assertTrue(PasswordPolicy.errors("LongEnough1").isEmpty())
        assertTrue(PasswordPolicy.isValidPassword("BrandNewPass456"))
    }

    @Test
    fun validEmailIsAccepted() {
        assertTrue(PasswordPolicy.isValidEmail("user@example.com"))
        assertTrue(PasswordPolicy.isValidEmail("first.last@sub.domain.io"))
    }

    @Test
    fun malformedEmailsAreRejected() {
        assertFalse(PasswordPolicy.isValidEmail(""))
        assertFalse(PasswordPolicy.isValidEmail("no-at-sign"))
        assertFalse(PasswordPolicy.isValidEmail("@example.com"))
        assertFalse(PasswordPolicy.isValidEmail("a@b@c"))
        assertFalse(PasswordPolicy.isValidEmail("user@localhost"))
        assertFalse(PasswordPolicy.isValidEmail("user@ example.com"))
        assertFalse(PasswordPolicy.isValidEmail("user@example .com"))
        assertFalse(PasswordPolicy.isValidEmail("user@.com"))
        assertFalse(PasswordPolicy.isValidEmail("user@example.com."))
        assertFalse(PasswordPolicy.isValidEmail("${"x".repeat(250)}@example.com")) // > 254 chars
    }
}
