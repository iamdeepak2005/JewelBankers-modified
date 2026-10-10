package com.jewelbankers.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.apache.commons.text.similarity.LevenshteinDistance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.jewelbankers.Utility.SettingsUtillity;
import com.jewelbankers.dto.CustomerSearchResult;
import com.jewelbankers.entity.Customer;
import com.jewelbankers.repository.CustomerRepository;

@Service
public class CustomerService {

    public List<CustomerSearchResult> searchCustomersFuzzy(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }

        String q = query.trim().toLowerCase();
        List<Customer> candidates;
        if (q.matches("\\d{7,15}")) {
            try {
                Long phone = Long.parseLong(q);
                candidates = findByPhoneNo(phone);
            } catch (NumberFormatException e) {
                candidates = findCustomersByName(q);
            }
        } else {
            candidates = customerRepository.findAll(PageRequest.of(0, 300)).getContent();
        }

        List<CustomerSearchResult> results = new ArrayList<>();
        LevenshteinDistance ld = new LevenshteinDistance();

        for (Customer c : candidates) {
            String name = c.getCustomerName() != null ? c.getCustomerName().trim().toLowerCase() : "";
            double similarity = 0.0;

            if (name.equals(q)) {
                similarity = 1.0;
            } else if (name.startsWith(q) || name.contains(q)) {
                similarity = 0.9;
            } else {
                int distance = ld.apply(q, name);
                int maxLen = Math.max(q.length(), name.length());
                if (maxLen > 0) {
                    similarity = Math.max(0.0, 1.0 - ((double) distance / maxLen));
                }
            }

            if (similarity >= 0.40) {
                CustomerSearchResult item = new CustomerSearchResult();
                item.setCustomerid(c.getCustomerid());
                item.setCustomerName(c.getCustomerName());
                item.setAddress(c.getAddress());
                item.setStreet(c.getStreet());
                item.setArea(c.getArea());
                item.setDistrict(c.getDistrict());
                item.setState(c.getState());
                item.setMobileno(c.getMobileno());
                item.setPhoneno(c.getPhoneno());
                item.setPincode(c.getPincode());
                item.setSimilarityScore(similarity);

                if (similarity >= 0.95) item.setMatchCategory("EXACT");
                else if (similarity >= 0.80) item.setMatchCategory("STRONG");
                else if (similarity >= 0.60) item.setMatchCategory("POSSIBLE");
                else item.setMatchCategory("WEAK");

                results.add(item);
            }
        }

        results.sort((a, b) -> Double.compare(b.getSimilarityScore(), a.getSimilarityScore()));
        return results;
    }

	
	@Autowired
	private CustomerRepository customerRepository;
	
	@Autowired
	private SettingsUtillity settingsUtillity;
	
	public List<Customer> findCustomersByName(String customerName) {
		//String customername="%"+CustomerName+"%";
		//String customername=customerName;
		//System.out.println(customerName);		
        //return customerRepository.findByStreetIgnoreCaseContaining(customername);
        return customerRepository.findByCustomerNameIgnoreCaseContaining(customerName);
        
    }
	
	 public Customer addCustomer(Customer customer) {
	        System.out.println(customer.toString());
	        return customerRepository.save(customer);
	    }
	

    public CustomerService() {
        //this.customers = buildFakeCustomers();
    }

	/*
	 * private List<Customer> buildFakeCustomers() { Customer c1 = new
	 * Customer(1L,"John Doe", "john@example.com", "1234567890"); Customer c2 = new
	 * Customer(2L,"Jane Smith", "jane@example.com", "0987654321"); Customer c3 =
	 * new Customer(3L,"Michael Johnson", "michael@example.com", "1122334455");
	 * Customer c4 = new Customer(4L,"Patricia Brown", "patricia@example.com",
	 * "6677889900"); Customer c5 = new Customer(5L,"Linda Davis",
	 * "linda@example.com", "2233445566");
	 * 
	 * return List.of(c1, c2, c3, c4, c5); }
	 */

    public List<Customer> findAll() {
        Pageable pageable = PageRequest.of(0, 500); // Allow up to 500 records for fast lookup
        return customerRepository.findAll(pageable).getContent(); // Convert Page to List
    }
    
    public List<Customer> findByNameStartingWith(String customerName) {
        Pageable pageable = PageRequest.of(0, 25); // Limit to 100 records
        return customerRepository.findByCustomerNameStartingWithIgnoreCase(customerName, pageable);
    }

    public List<Customer> findByPhoneNo(Long phoneno) {
        Pageable pageable = PageRequest.of(0, 25); // Limit to 100 records
        return customerRepository.findByPhonenoOrMobilenoStartingWith(phoneno, pageable);
    }

    public List<Customer> findByNameAndPhone(String customerName, Long phoneno) {
        Pageable pageable = PageRequest.of(0, 25); // Limit to 100 records
        return customerRepository.findByCustomerNameContainingIgnoreCaseAndPhoneno(customerName, phoneno, pageable);
    }

	
	  public Optional<Customer> findById(Long id) { 
		  return this.customerRepository.findById(id); 
		 }

	public Customer saveCustomer(Customer customer) {
		// TODO Auto-generated method stub
		return customerRepository.save(customer);
	}

	public String deleteCustomer(Long id) {
		// TODO Auto-generated method stub
		if (customerRepository.existsById(id)) {
		    customerRepository.deleteById(id);
		    return("Sucessfully deleted for Customer Id "+id);

		} else {
		     return("Customer ID is not found");
		}
		
	}

	public Customer updateCustomer(Long id, Customer customer) {
		// TODO Auto-generated method stub
		 Customer existingCustomer = customerRepository.findById(id).orElse(null);
	        if (existingCustomer != null) {
	            existingCustomer.setCustomerName(customer.getCustomerName());
	            existingCustomer.setAddress(customer.getAddress());
	            existingCustomer.setStreet(customer.getStreet());
	            existingCustomer.setArea(customer.getArea());
	            existingCustomer.setCountry(customer.getCountry());
	            existingCustomer.setDistrict(customer.getDistrict());
	            existingCustomer.setMailid(customer.getMailid());
	            existingCustomer.setMobileno(customer.getMobileno());
	            existingCustomer.setPhoneno(customer.getPhoneno());
	            existingCustomer.setPincode(customer.getPincode());
	            existingCustomer.setRelationship(customer.getRelationship());
	            existingCustomer.setRelationshipname(customer.getRelationshipname());
	            existingCustomer.setProofType(customer.getProofType());
	            existingCustomer.setProofDetails(customer.getProofDetails());
	            existingCustomer.setPhoto(customer.getPhoto());
	           // existingCustomer.setEmail(customer.getEmail());
	            // Update other fields as needed
	            return customerRepository.save(existingCustomer);
	        } else {
	            // Handle case where customer is not found, e.g., throw an exception
	            return null;
	        }
		//return null;
	}

	public String savePhoto(MultipartFile file, String customerName, Map<String, String> settingsMap) throws IOException {
	    // Handle null settingsMap
	    if (settingsMap == null) {
	        settingsMap = new HashMap<>();
	    }

	    String photoFolder = settingsUtillity.getPhotoFolder(settingsMap);
	    String sanitizedCustomerName = customerName.trim().replaceAll("[^a-zA-Z0-9]", "_");
	    String fileName = sanitizedCustomerName + ".jpg";
	    String filePath = photoFolder + "\\uploads\\" + fileName;
	    Path path = Paths.get(filePath);
	    
	    Files.createDirectories(path.getParent());
	    Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

	    return filePath;
	}


	 
}
