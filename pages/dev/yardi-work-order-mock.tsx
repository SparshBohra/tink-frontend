import Head from 'next/head';
import { useState } from 'react';

/**
 * Deployed twin of extension/fixtures/yardi-work-order-mock.html for testing the Chrome extension on staging/prod.
 * Same field ids/names and data-squareft-* markers for page detection.
 */
export default function YardiWorkOrderMockPage() {
  const [briefLen, setBriefLen] = useState(0);
  const [problemLen, setProblemLen] = useState(0);

  return (
    <>
      <Head>
        <title>Facility Manager — Work Order (POC mock)</title>
        <meta name="robots" content="noindex, nofollow" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@3.4.1/dist/css/bootstrap.min.css"
        />
        <style>{`
          .yardi-mock-root { background: #f4f4f4; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; min-height: 100vh; }
          .yardi-mock-root .fm-topbar { background: #2c3e50; color: #fff; padding: 10px 20px; }
          .yardi-mock-root .fm-topbar .brand { font-weight: 600; letter-spacing: 0.02em; }
          .yardi-mock-root .wo-banner {
            background: #0969a6; color: #fff; padding: 12px 20px; margin: 0 0 16px;
            font-size: 20px; font-weight: 100; letter-spacing: 1px; text-align: center;
          }
          .yardi-mock-root .panel-title { font-size: 16px; }
          .yardi-mock-root label.text-muted.required::after { content: " *"; color: #c00; }
          .yardi-mock-root .text-muted { color: #777; }
          .yardi-mock-root .fixture-note { font-size: 12px; color: #666; margin-bottom: 16px; }
        `}</style>
      </Head>

      <div
        className="yardi-mock-root yardi-facility-manager-mock"
        data-squareft-yardi-mock="1"
        data-squareft-fixture="yardi-work-order-v1"
      >
        <div className="fm-topbar">
          <span className="brand">Facility Manager</span>
          <span className="pull-right text-muted" style={{ color: '#bdc3c7' }}>
            POC mock — not affiliated with Yardi
          </span>
        </div>

        <div className="container-fluid" style={{ maxWidth: 1200, marginTop: 16 }}>
          <p className="fixture-note">
            This page mimics the <strong>Work Order</strong> form field names/ids from a saved Facility
            Manager snapshot (Location → Contact → Description → Priority/Category). Use it to test autofill
            selectors before touching production Yardi. Served from Next.js at{' '}
            <code>/dev/yardi-work-order-mock</code>.
          </p>

          <h1 className="wo-banner">Work Order #</h1>

          <form id="fm-work-order-form" autoComplete="off">
            <div className="panel panel-default">
              <div className="panel-heading">
                <h2 id="headerLocation" className="panel-title">
                  Location
                </h2>
              </div>
              <div className="panel-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-muted required" htmlFor="acProperty">
                        Property
                      </label>
                      <select className="form-control" id="acProperty" name="property" required>
                        <option value="">Select property…</option>
                        <option value="1">Synergy Demo Tower</option>
                        <option value="2">Harbor View Apartments</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-muted" htmlFor="acLeaseCustomer">
                        Lease
                      </label>
                      <select className="form-control" id="acLeaseCustomer" name="leasecustomer">
                        <option value="">Select lease…</option>
                        <option value="101">Unit 4B — Smith</option>
                        <option value="102">Unit 12A — Johnson</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-muted" htmlFor="acLocation">
                        Location
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="acLocation"
                        name="location"
                        placeholder="Select location…"
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-muted" htmlFor="acBuilding">
                        Building
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="acBuilding"
                        name="building"
                        placeholder="Select building…"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-muted" htmlFor="acFloor">
                        Floor
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="acFloor"
                        name="floor"
                        placeholder="Select floor…"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-muted" htmlFor="acUnit">
                        Unit
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="acUnit"
                        name="unit"
                        placeholder="Select unit…"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel panel-default">
              <div className="panel-heading">
                <h2 id="headerContact" className="panel-title">
                  Contact
                </h2>
              </div>
              <div className="panel-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-muted" htmlFor="ddContactInfo">
                        Saved contacts
                      </label>
                      <select className="form-control" id="ddContactInfo" name="contactInfo">
                        <option value="">—</option>
                        <option value="primary">Primary — mobile</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-muted required" htmlFor="textCallerName">
                        Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="textCallerName"
                        name="callerName"
                        maxLength={200}
                        placeholder="Name"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-muted required" htmlFor="textCallerPhone">
                        Phone
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="textCallerPhone"
                        name="callerPhone"
                        maxLength={25}
                        placeholder="Phone"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="text-muted" htmlFor="emailCallerEmail">
                        Email
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="emailCallerEmail"
                        name="emailinput"
                        maxLength={80}
                        placeholder="Email"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel panel-default">
              <div className="panel-heading">
                <h2 id="headerDescription" className="panel-title">
                  Description
                </h2>
              </div>
              <div className="panel-body">
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label className="text-muted required" htmlFor="textBriefDescription">
                        Brief Description
                      </label>
                      <span className="pull-right text-muted text-xs">
                        <span id="spanBriefDescLen">{briefLen}</span>/35
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        id="textBriefDescription"
                        name="briefDescription"
                        maxLength={35}
                        placeholder="Brief Description"
                        required
                        onChange={(e) => setBriefLen(e.target.value.length)}
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label className="text-muted" htmlFor="textareaProblemDescription">
                        Description
                      </label>
                      <span className="pull-right text-muted text-xs">
                        <span id="spanProblemDescLen">{problemLen}</span>/4000
                      </span>
                      <textarea
                        className="form-control"
                        id="textareaProblemDescription"
                        name="problemDescription"
                        rows={4}
                        maxLength={4000}
                        placeholder="Problem Description"
                        onChange={(e) => setProblemLen(e.target.value.length)}
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label className="text-muted" htmlFor="textAccessNotes">
                        Access Notes
                      </label>
                      <textarea
                        className="form-control"
                        id="textAccessNotes"
                        name="accessNotes"
                        rows={5}
                        maxLength={7000}
                        placeholder="Access Notes"
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4 col-md-offset-8 m-l-lg">
                    <div className="form-group">
                      <label className="text-muted required" htmlFor="ddPriority">
                        Priority
                      </label>
                      <select className="form-control" id="ddPriority" name="priority" required>
                        <option value="">—</option>
                        <option value="Urgent - ASAP">Urgent - ASAP</option>
                        <option value="Same Day">Same Day</option>
                        <option value="Non-Urgent">Non-Urgent</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="text-muted required" htmlFor="ddCategory">
                        Category
                      </label>
                      <select className="form-control" id="ddCategory" name="category" required>
                        <option value="">—</option>
                        <option value="Access Card">Access Card</option>
                        <option value="Administrative">Administrative</option>
                        <option value="Building">Building</option>
                        <option value="Capital Work">Capital Work</option>
                        <option value="Electrical">Electrical</option>
                        <option value="HVAC">HVAC</option>
                        <option value="Plumbing">Plumbing</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="text-muted" htmlFor="ddSubcategory">
                        Subcategory
                      </label>
                      <select className="form-control" id="ddSubcategory" name="subcategory">
                        <option value="">—</option>
                        <option value="General">General</option>
                        <option value="Leak">Leak</option>
                        <option value="No heat">No heat</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="well">
              <button type="button" className="btn btn-default" disabled>
                Save (mock)
              </button>
              <span className="text-muted" style={{ marginLeft: 12 }}>
                Submit is disabled — POC form only.
              </span>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
