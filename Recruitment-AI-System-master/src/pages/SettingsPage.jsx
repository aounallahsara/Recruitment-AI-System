import React from "react";

function SettingsPage() {
  return (
    <div style={{padding:"30px"}}>

      <h1>⚙️ Settings</h1>
      <p>Configuration du système</p>

      <div style={{marginTop:"30px"}}>

        <h3>Notifications</h3>
        <label>
          <input type="checkbox" />
          Email notifications
        </label>

        <br /><br />

        <h3>Language</h3>
        <select>
          <option>Français</option>
          <option>English</option>
        </select>

        <br /><br />

        <h3>Dark Mode</h3>
        <label>
          <input type="checkbox"/>
          Enable dark mode
        </label>

        <br /><br />

        <button style={{
          padding:"10px 20px",
          background:"#2563eb",
          color:"white",
          border:"none",
          borderRadius:"6px"
        }}>
          Save Settings
        </button>

      </div>

    </div>
  );
}

export default SettingsPage;