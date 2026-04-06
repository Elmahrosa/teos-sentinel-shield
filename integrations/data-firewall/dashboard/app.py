# Add this import at the TOP of dashboard/app.py with other imports:
from sqlalchemy import text

# ... then replace the entire "with tab1:" block with this:

with tab1:
    st.subheader("Audit Log")
    status_filter = st.selectbox(
        "Filter by status",
        ["ALL", "COMPLETED", "BLOCKED", "FAILED", "RUNNING", "RETRYING", "PENDING"]
    )
    
    # Parameterized query — safe from SQL injection
    if status_filter != "ALL":
        sql = text("""
            SELECT job_id, status, domain, source_url, pii_found, 
                   content_hash, security_event, created_at 
            FROM jobs 
            WHERE status = :status 
            ORDER BY created_at DESC 
            LIMIT 200
        """)
        df = query(sql, params={"status": status_filter})
    else:
        sql = text("""
            SELECT job_id, status, domain, source_url, pii_found, 
                   content_hash, security_event, created_at 
            FROM jobs 
            ORDER BY created_at DESC 
            LIMIT 200
        """)
        df = query(sql)
    
    st.dataframe(df, use_container_width=True)
    
    # Export
    csv = df.to_csv(index=False).encode()
    st.download_button("⬇️ Export CSV", csv, "audit_log.csv", "text/csv")
