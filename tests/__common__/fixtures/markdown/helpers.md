<!-- markdownlint-disable -->
<div class="main-container">
  <div class="test-results-wrapper">
    <div class="test-results">

<!-- ---------------------------------------------------------------- -->
<!-- Basic If/Else Tests -->
<!-- ---------------------------------------------------------------- -->

<div class="section-block">
<h2>Basic If/Else Tests</h2>

<span class="explanation"> if(showBasic == true) </span><br>
{{#if showBasic}}
<span class="pass">Basic if condition is working!</span>
{{else}}
<span class="failed">\{\{showBasic\}\}is not true!</span>
{{/if}}

<span class="explanation"> if(emptyString == "") </span><br>
{{#if emptyString}}
<span class="failed">\{\{emptyString\}\} should not show this</span>
{{else}}
<span class="pass">\{\{emptyString\}\} correctly shows else block</span>
{{/if}}

<span class="explanation"> if(nullValue == null) </span><br>
{{#if nullValue}}
<span class="failed">\{\{nullValue\}\} should not show this</span>
{{else}}
<span class="pass">\{\{nullValue\}\} correctly shows else block</span>
{{/if}}
</div>

<!-- ---------------------------------------------------------------- -->
<!-- Equality Tests -->
<!-- ---------------------------------------------------------------- -->

<div class="section-block">
<h2>Equality Tests</h2>

<span class="explanation"> if(stringTest == "hello") </span><br>
{{#eq stringTest "hello"}}
<span class="pass">String equality test passed!</span>
{{else}}
<span class="failed">String equality test failed!</span>
{{/eq}}

<span class="explanation"> if(numberTest == 42) </span><br>
{{#eq numberTest 42}}
<span class="pass">Number equality test passed!</span>
{{else}}
<span class="failed">Number equality test failed!</span>
{{/eq}}

<span class="explanation"> if(booleanTest == true) </span><br>
{{#eq booleanTest true}}
<span class="pass">Boolean equality test passed!</span>
{{else}}
<span class="failed">Boolean equality test failed!</span>
{{/eq}}

<span class="explanation"> if(outerCondition == true){<br> if(innerCondition == false) }</span><br>
{{#if outerCondition}}
<span class="pass">Outer condition passed!</span>
{{#if innerCondition}}
<span class="failed">Both conditions passed!</span>
{{else}}
<span class="pass">Only outer condition passed!</span>
{{/if}}
{{else}}
<span class="failed">Outer condition failed!</span>
{{#if innerCondition}}
<span class="failed">Only inner would have passed!</span>
{{else}}
<span class="failed">Both conditions failed!</span>
{{/if}}
{{/if}}
</div>

<!-- ---------------------------------------------------------------- -->
<!-- Complex Combinations -->
<!-- ---------------------------------------------------------------- -->

<div class="section-block">
<h2>Complex Combinations</h2>

<span class="explanation"> if(complexTest == true) <br> if(complexValue == "special") </span><br>
{{#if complexTest}}
{{#eq complexValue "special"}}
<span class="pass">Both if and equality passed!</span>
{{else}}
<span class="failed">If passed but equality failed!</span>
{{/eq}}
{{else}}
<span class="failed">If condition failed!</span>
{{/if}}

<span class="explanation"> if(firstValue == "first") </span><br>
{{#eq firstValue "first"}}
<span class="pass">First level passed!</span>
<span class="explanation"> if(secondValue == "second") </span><br>
{{#eq secondValue "second"}}
<span class="pass">Both levels passed!</span>
{{else}}
<span class="failed">Only first level passed!</span>
{{/eq}}
{{else}}
<span class="failed">First level failed!</span>
{{#eq secondValue "second"}}
Would have passed second level!
{{else}}
<span class="pass">Both levels failed!</span>
{{/eq}}
{{/eq}}
</div>

<!-- ---------------------------------------------------------------- -->
<!-- Array Tests -->
<!-- ---------------------------------------------------------------- -->

<div class="section-block">
<h2>Array Tests</h2>

<span class="explanation">for(i=0; i&amp;lt;arrayTest.length; i++) // length is {{arrayTest.length}}</span><br>
{{#each arrayTest}}
<span class="pass">Item {{@index}}: {{this}}</span>
{{#if this}}
<span class="pass">- Value is truthy</span><br>
{{else}}
<span class="pass">- Value is falsy</span><br>
{{/if}}
{{/each}}
</div>

<!-- ---------------------------------------------------------------- -->
<!-- Object Tests -->
<!-- ---------------------------------------------------------------- -->

<div class="section-block">
<h2> Object Tests</h2>

<span class="explanation">(objectTest.status1 == valid)</span><br>
<span class="pass">Property status1: {{objectTest.status1}}</span>
{{#eq objectTest.status1 "valid"}}
<span class="pass">- Is valid</span><br>
{{else}}
<span class="failed">- Is not valid</span><br>
{{/eq}}

<span class="explanation">(objectTest.status2 == invalid)</span><br>
<span class="pass">Property status2: {{objectTest.status2}}</span>
{{#eq objectTest.status2 "invalid"}}
<span class="pass">- Is invalid</span><br>
{{else}}
<span class="failed">- Is valid</span><br>
{{/eq}}

<span class="explanation">(objectValues.status1 == valid_object)</span><br>
<span class="pass">Property status1: {{objectValues.status1}}</span>
{{#eq objectValues.status1 "valid_object"}}
<span class="pass">- Is valid</span><br>
{{else}}
<span class="failed">- Is not valid</span><br>
{{/eq}}

<span class="explanation">(objectValues.status2 == invalid_object)</span><br>
<span class="pass">Property status2: {{objectValues.status2}}</span>
{{#eq objectValues.status2 "invalid_object"}}
<span class="failed">- Is valid</span><br>
{{else}}
<span class="pass">- Is not valid</span><br>
{{/eq}}
</div>

<!-- ---------------------------------------------------------------- -->
<!-- Edge Cases -->
<!-- ---------------------------------------------------------------- -->

<div class="section-block">
<h2>Edge Cases</h2>

<span class="explanation"> if(undefined) </span><br>
{{#if undefined}}
<span class="pass">Should not show for undefined</span>
{{else}}
<span class="failed">Equalling undefined as truthy</span>
{{/if}}

<span class="explanation"> if(0) </span><br>
{{#if zero}}
<span class="failed">Should not show for zero</span>
{{else}}
<span class="pass">Should show for zero</span>
{{/if}}

<span class="explanation"> if(trueBool) </span><br>
{{#if trueBool}}
<span class="pass">Correctly showing true boolean</span>
{{else}}
<span class="failed">Should not reach here for true boolean</span>
{{/if}}

<span class="explanation"> if(falseBool) </span><br>
{{#if falseBool}}
<span class="failed">Should not show for false boolean</span>
{{else}}
<span class="pass">Correctly handling false boolean</span>
{{/if}}

<span class="explanation"> if(specialChar == "!@#$%^&*()") <br> {{specialChar}} </span><br>
{{#eq specialChar "!@#$%^&*()"}}
<span class="pass">Special characters match!</span>
{{else}}
<span class="failed">Special characters don't match!</span>
{{/eq}}

<span class="explanation"> show "{{spacedValue}}" </span><br>
{{#eq spacedValue true}}
<span class="pass">Removes spaces if not quoted</span>
{{else}}
<span class="failed">Spaces in equality tests are different</span>
{{/eq}}

<span class="explanation"> if(spacedString == "  trimmed") </span><br>
{{#eq spacedString "  trimmed"}}
<span class="pass">Spaces in equality tests should match exactly</span>
{{else}}
<span class="failed">Spaces in equality tests are different</span>
{{/eq}}
</div>

<!-- ---------------------------------------------------------------- -->
<!-- Currency Formatting -->
<!-- ---------------------------------------------------------------- -->

<div class="section-block">
<h2>Currency Formatting</h2>

<span class="explanation"> currency(1000, "USD") </span><br>
{{#currency 1000 "USD"}}
<span class="pass">Currency formatting with USD: <span class="imported-value">{{this}}</span></span>
{{else}}
<span class="failed">Currency formatting failed</span>
{{/currency}}

<span class="explanation"> currency(1000, "EUR") </span><br>
{{#currency 1000 "EUR"}}
<span class="pass">Currency formatting with EUR: <span class="imported-value">{{this}}</span></span>
{{else}}
<span class="failed">Currency formatting failed</span>
{{/currency}}

<span class="explanation"> currency(1000.50, "USD") </span><br>
{{#currency 1000.50 "USD"}}
<span class="pass">Currency with decimals: <span class="imported-value">{{this}}</span></span>
{{else}}
<span class="failed">Currency decimal handling failed</span>
{{/currency}}
</div>

<!-- ---------------------------------------------------------------- -->
<!-- Date Helpers -->
<!-- ---------------------------------------------------------------- -->

<div class="section-block">
<h2>Date Helpers</h2>

<span class="explanation"> addYears("2024-01-01", 1) </span><br>
{{#if (addYears "2024-01-01" 1)}}
<span class="pass">Add years helper working: {{addYears "2024-01-01" 1}}</span>
{{else}}
<span class="failed">Add years helper failed</span>
{{/if}}

<span class="explanation"> now.format("YYYY-MM-DD") </span><br>
{{#if (now "YYYY-MM-DD")}}
<span class="pass">Now helper working: {{now "YYYY-MM-DD"}}</span>
{{else}}
<span class="failed">Now helper failed</span>
{{/if}}

<span class="explanation"> formatDate("2024-01-01", "DEFAULT") </span><br>
{{#if (formatDate "2024-01-01" "DEFAULT")}}
<span class="pass">Default date format working: {{formatDate "2024-01-01" "DEFAULT"}}</span>
{{else}}
<span class="failed">Default date format failed</span>
{{/if}}

<span class="explanation"> formatDate("2024-01-01", "ISO") </span><br>
{{#if (formatDate "2024-01-01" "ISO")}}
<span class="pass">ISO date format working: {{formatDate "2024-01-01" "ISO"}}</span>
{{else}}
<span class="failed">ISO date format failed</span>
{{/if}}

<span class="explanation"> formatDate("2024-01-01", "FULL") </span><br>
{{#if (formatDate "2024-01-01" "FULL")}}
<span class="pass">Full date format working: {{formatDate "2024-01-01" "FULL"}}</span>
{{else}}
<span class="failed">Full date format failed</span>
{{/if}}
</div>

<!-- ---------------------------------------------------------------- -->
<!-- Object Lookup Helper -->
<!-- ---------------------------------------------------------------- -->

<div class="section-block">
<h2>Object Lookup Helper</h2>

<span class="explanation"> lookup(testObject, "property") </span><br>
{{#lookup testObject "property"}}
<span class="pass">Object lookup working: <span class="imported-value">{{this}}</span></span>
{{else}}
<span class="failed">Object lookup failed</span>
{{/lookup}}

<span class="explanation"> lookup(testObject.nested, "deepProperty") </span><br>
{{#lookup testObject.nested "deepProperty"}}
<span class="pass">Nested object lookup working: <span class="imported-value">{{this}}</span></span>
{{else}}
<span class="failed">Nested object lookup failed</span>
{{/lookup}}
</div>


<!-- ---------------------------------------------------------------- -->
<!-- Table Values -->
<!-- ---------------------------------------------------------------- -->


</div>
  </div>
  <div class="value-table-wrapper">
    <div class="value-table">
      <h2>Test Values</h2>
      <table>
        <thead>
          <tr>
            <th>CSV Key</th>
            <th>CSV Value</th>
            <th>Handlebars Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>showBasic</td>
            <td><span class="csv-value">true</span></td>
            <td>{{showBasic}}</td>
          </tr>
          <tr>
            <td>emptyString</td>
            <td><span class="csv-value">""</span></td>
            <td>{{emptyString}}</td>
          </tr>
          <tr>
            <td>nullValue</td>
            <td><span class="csv-value">null</span></td>
            <td>{{nullValue}}</td>
          </tr>
          <tr>
            <td>stringTest</td>
            <td><span class="csv-value">hello</span></td>
            <td>{{stringTest}}</td>
          </tr>
          <tr>
            <td>numberTest</td>
            <td><span class="csv-value">42</span></td>
            <td>{{numberTest}}</td>
          </tr>
          <tr>
            <td>booleanTest</td>
            <td><span class="csv-value">true</span></td>
            <td>{{booleanTest}}</td>
          </tr>
          <tr>
            <td>outerCondition</td>
            <td><span class="csv-value">true</span></td>
            <td>{{outerCondition}}</td>
          </tr>
          <tr>
            <td>innerCondition</td>
            <td><span class="csv-value">false</span></td>
            <td>{{innerCondition}}</td>
          </tr>
          <tr>
            <td>complexTest</td>
            <td><span class="csv-value">true</span></td>
            <td>{{complexTest}}</td>
          </tr>
          <tr>
            <td>complexValue</td>
            <td><span class="csv-value">special</span></td>
            <td>{{complexValue}}</td>
          </tr>
          <tr>
            <td>firstValue</td>
            <td><span class="csv-value">first</span></td>
            <td>{{firstValue}}</td>
          </tr>
          <tr>
            <td>secondValue</td>
            <td><span class="csv-value">second</span></td>
            <td>{{secondValue}}</td>
          </tr>
          <tr>
            <td>arrayTest</td>
            <td><span class="csv-value">[true,false,"",0,null]</span></td>
            <td>{{arrayTest}}</td>
          </tr>
          <tr>
            <td>arrayTest (items)</td>
            <td><span class="csv-value">[true,false,"",0,null]</span></td>
            <td style="padding:0 !important;line-height:1 !important;vertical-align:middle !important;white-space:normal !important">
              <div style="margin:0 !important;padding:0 !important;line-height:1 !important;font-size:5.5pt !important">{{#each arrayTest}}{{@index}}: {{this}}{{#unless @last}}<br>{{/unless}}{{/each}}</div>
            </td>
          </tr>
          <tr>
            <td>objectValues</td>
            <td><span class="csv-value">{"status1":"valid_object","status2":"invalid_object"}</span></td>
            <td>{{objectValues}}</td>
          </tr>
          <tr>
            <td>objectTest.status1</td>
            <td><span class="csv-value">valid</span></td>
            <td>{{objectTest.status1}}</td>
          </tr>
          <tr>
            <td>objectTest.status2</td>
            <td><span class="csv-value">invalid</span></td>
            <td>{{objectTest.status2}}</td>
          </tr>
          <tr>
            <td>undefined</td>
            <td><span class="csv-value">undefined</span></td>
            <td>{{undefined}}</td>
          </tr>
          <tr>
            <td>zero</td>
            <td><span class="csv-value">0</span></td>
            <td>{{zero}}</td>
          </tr>
          <tr>
            <td>trueBool</td>
            <td><span class="csv-value">true</span></td>
            <td>{{trueBool}}</td>
          </tr>
          <tr>
            <td>falseBool</td>
            <td><span class="csv-value">false</span></td>
            <td>{{falseBool}}</td>
          </tr>
          <tr>
            <td>specialChar</td>
            <td><span class="csv-value">!@#$%^&*()</span></td>
            <td>{{specialChar}}</td>
          </tr>
          <tr>
            <td>spacedValue</td>
            <td><span class="csv-value">true</span></td>
            <td>{{spacedValue}}</td>
          </tr>
          <tr>
            <td>spacedString</td>
            <td><span class="csv-value">"  trimmed"</span></td>
            <td>{{spacedString}}</td>
          </tr>
          <tr>
            <td>formatDate</td>
            <td><span class="csv-value">"2024-01-01"</span></td>
            <td>{{formatDate}}</td>
          </tr>
          <tr>
            <td>formatDate.DEFAULT</td>
            <td><span class="csv-value">"2024-01-01"</span></td>
            <td>{{formatDate.DEFAULT}}</td>
          </tr>
          <tr>
            <td>formatDate.ISO</td>
            <td><span class="csv-value">"2024-01-01"</span></td>
            <td>{{formatDate.ISO}}</td>
          </tr>
          <tr>
            <td>formatDate.FULL</td>
            <td><span class="csv-value">"2024-01-01"</span></td>
            <td>{{formatDate.FULL}}</td>
          </tr>
          <tr>
            <td>lookup.testObject.property</td>
            <td><span class="csv-value">value</span></td>
            <td>{{lookup.testObject.property}}</td>
          </tr>
          <tr>
            <td>lookup.testObject.nested.deepProperty</td>
            <td><span class="csv-value">value</span></td>
            <td>{{lookup.testObject.nested.deepProperty}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
