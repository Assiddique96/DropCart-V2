import BusinessStamp from "./BusinessStamp"; // adjust path

// …

<section style={styles.bottomBar}>
  <div style={styles.stampAndInfo}>
    <BusinessStamp
      accent={accent}
      companyText="Shpinx"
      statusText="Approved"
      footerText="Global supply. Local success"
      size={96}
      ring="double"
      opacity={0.85}
      thickness={2}
      shape="circle"
    />
    <div style={styles.stampLabel}>
      Digital business stamp for internal validation.
    </div>
  </div>

  <div style={styles.signatureBlock}>
    <div style={styles.signatureLine(accent)} />
    <div style={styles.signatureName}>Elena Morozova</div>
    <div style={styles.signatureLabel}>Authorized Signature</div>
  </div>
</section>
